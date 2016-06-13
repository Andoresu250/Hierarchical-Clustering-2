String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 
var selectIndex = 0;
var ref = new Firebase("https://hierarchicalcluster.firebaseio.com/");
var filesRef = ref.child("files");
var fireBaseFiles = [];
filesRef.on("value", function(snapshot) {
    snapshot.forEach(function(fileSnapshot) {
        fireBaseFiles.push(fileSnapshot.val());  
        var select = document.getElementById("fireBaseFiles");
        var opt = "Archivo con: " + fileSnapshot.val().length + " Ciudades";
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = selectIndex;
        selectIndex++;
        select.appendChild(el);
    });  
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});

var map;
var colors = [ "#000230", "#1e1227", "#39064a", "#741109", "#033550",
                "#23371e", "#003888", "#66002a", "#b31000", "#1199ff",
                "#008080", "#aa3355", "#cc0000", "#bdf648", "#e9df15",
                "#00cc00", "#cc00cc", "#81217a", "#b4be31", "#be8231"  
            ];
var cities = [
            /*0*/    "Arauca,Arauca,Colombia",
            /*1*/    "Armenia,Quindio,Colombia",
            /*3*/    "Barranquilla,Atlantico,Colombia",
            /*4*/    "Bogota,Distrito Capital,Colombia",
            /*5*/    "Bucaramanga,Santander,Colombia",
            /*6*/    "Buenaventura,Valle del Cauca,Colombia",
            /*7*/    "Cali,Valle del Cauca,Colombia",
            /*8*/    "Pasto,Nariño,Colombia",
            /*9*/    "Las Cumbres, Panama",
            /*10*/   "Panama City,Panama District,Panama"
            ];
/*var cities = [
                "Arauca,Arauca,Colombia",
                "Armenia,Quindio,Colombia",
                "Barranquilla,Atlantico,Colombia",
                "Bogota,Distrito Capital,Colombia",
                "Bucaramanga,Santander,Colombia",
                "Buenaventura,Valle del Cauca,Colombia",
                "Cali,Valle del Cauca,Colombia",
                "Cartagena,Bolivar,Colombia",
                "Cucuta,Norte de Santander,Colombia",
                "Florencia,Caqueta,Colombia",
                "Ibague,Tolima,Colombia",
                "Manizales,Caldas,Colombia",
                "Medellin,Antioquia,Colombia",
                "Mocoa,Putumayo,Colombia",
                "Monteria,Cordoba,Colombia",
                "Neiva,Huila,Colombia",
                "Pasto,Nariño,Colombia",
                "Pereira,Risaralda,Colombia",
                "Popayan,Cauca,Colombia",
                "Quibdo,Choco,Colombia"
            ];*/
var originalMatrix = [];
var matrix = [];
var copyMatrix = [];
var clusters = [];
var matrixIndexI = 0;
var matrixIndexJ = 0;
var n;
var m;
var routes;
var cur = 0;
var curDistance = 0;
var curMarker = 0;
var requestArray = [];
var directionsService = new google.maps.DirectionsService();
var geocoder = geocoder = new google.maps.Geocoder();
var renderArray = []
var distanceArray;
var label = 0;
var fileText = "";
var theRealRoutes;
var openAFile = false;


function readFile (evt) {    
   var files = evt.target.files;
   var file = files[0];           
   var reader = new FileReader();
   reader.onload = function() {     
     fileText = this.result;           
   }
   openAFile = true;
   reader.readAsText(file)
}

function sendFileToFireBase(cities){
    var filesRef = ref.child("files");
    var sw = false;
    for (var i = 0; i < fireBaseFiles.length; i++) {
        if(isFileInFireBase(cities, i)){
            sw = true;break;
        }
    }
    if(!sw){
        filesRef.push().set(cities);    
    }    
}

function isFileInFireBase(cities, j){    
    if(cities.length !== fireBaseFiles[j].length){
        return false;
    }
    for (var i = 0; i < fireBaseFiles.length; i++) {        
       if(fireBaseFiles[j][i] !== cities[i]){
            return false
       }
    }
    return true;
}

function getRoute(originCities, destinationCities){    
    var originArray = originCities.split(',');
    var destinationArray = destinationCities.split(',');
    var origin = parseInt(originArray[0]);
    var destination = parseInt(destinationArray[0]);
    var minDistance = originalMatrix[origin][destination]
    for (var i = 0; i < originArray.length; i++) {
        for (var j = 0; j < destinationArray.length; j++) {
            if(originalMatrix[parseInt(originArray[i])][parseInt(destinationArray[j])] < minDistance){
                origin = parseInt(originArray[i]);
                destination = parseInt(destinationArray[j]);
                minDistance = originalMatrix[origin][destination]
            }            
        }
    }
    console.log("Route: " + origin + " - " + destination);
    return {"origin":cities[origin],"destination":cities[destination]};
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 4.7, lng: -74.2},
            zoom: 6
        });
    var directionsDisplay = new google.maps.DirectionsRenderer({
            map: map
        });         
}

function isObjectInArray(array, object){
    for (var i = 0; i < array.length; i++) {
        if((array[i].origin === object.origin && array[i].destination === object.destination) || (array[i].origin === object.destination && array[i].destination === object.origin)){
            return true;
        }
    }
    return false;
}

function hirarchicalClustering(){
    theRealRoutes = []
    initCluster();
    while(matrix.length > 1 && !undefinedMatrix(matrix)){                                
        var obj = getMinValueMatrix();              
        var indexI = obj.i;
        var indexJ = obj.j;                    
        var origin = getCluster(indexI);
        var destination = getCluster(indexJ);
        console.log("i,j: " + indexI + "," + indexJ);
        console.log("origin: " + origin);
        console.log("destination: " + destination);
        var a = origin;
        a = a.replaceAll('(','');
        a = a.replaceAll(')','');
        a = a.replaceAll('*','');
        var b = destination;
        b = b.replaceAll('(','');
        b = b.replaceAll(')','');
        b = b.replaceAll('*','');  
        if(obj.value !== undefined){
            theRealRoutes.push(getRoute(a+"",b+""));    
            addCluster(origin, destination);            
        }        
        printMatrix(matrix);
    }
    printClusters();    
    console.log("The real routes:");
    for (var i = 0; i < theRealRoutes.length; i++) {
        console.log(theRealRoutes[i].origin + " - " + theRealRoutes[i].destination);        
    }
    generateRequestArray(theRealRoutes);
};

function undefinedMatrix(matrix){
    for (var i = 0; i < matrix.length; i++) {        
        for(var j = 0; j < matrix.length; j++){
            if(matrix[i][j] !== undefined){
                return false;
            }
        }
    }
    return true;
}

function printClusters(){
    for (var i = 0; i < clusters.length; i++) {
        console.log("Cluster #" + i + ": " + clusters[i]);
    }
    console.log("---------------------");
};

function getMinValueMatrix(){
    var min = matrix[0][1];
    var indexI = 0;
    var indexJ = 1;
    for (var i = 0; i < matrix.length; i++) {                                            
        for (var j = i + 1; j < matrix[0].length; j++) {
            if(min === undefined && matrix[i][j]!== undefined){
                min = matrix[i][j];
                indexI = i;
                indexJ = j;
            }                
            if(matrix[i][j] < min){
                min = matrix[i][j];
                indexI = i;
                indexJ = j;
            }
        }
    }
    var obj = {};
    obj["i"] = indexI;
    obj["j"] = indexJ;
    obj["value"] = min;         
    return obj;             
};

function initCluster(){
    for (var i = 0; i < cities.length; i++) {
        clusters.push(i+"");             
    }
};

function addCluster(origin,destination){
    var originIndex = findIndexRow(origin);
    var destinationIndex = findIndexRow(destination);           

    createNewCluster(origin, destination);
    addNewRow(originIndex, destinationIndex);
    addNewCol(originIndex, destinationIndex);           

    removeRow(originIndex);
    removeRow(destinationIndex - 1);
    removeCol(originIndex);
    removeCol(destinationIndex - 1);

    printClusters();                
};

function getCluster(index){
    return clusters[index];
};

function createNewCluster(origin, destination){         
    clusters.push("(" + origin + "," + destination + ")*");
};

function addNewRow(originIndex, destinationIndex){
    matrix.push(getNewRow(originIndex, destinationIndex));
};

function getNewRow(originIndex, destinationIndex){
    var row = [];           
    var rowO = getRow(originIndex);         
    var rowD = getRow(destinationIndex);
    for(var i = 0; i < rowO.length; i++){
        if(rowO[i] <= rowD){
            row.push(rowO[i]);
        }else{
            row.push(rowD[i]);
        }
    }
    return row;
};

function getNewCol(originIndex, destinationIndex){
    var col = [];
    var colO = getCol(originIndex);
    var colD = getCol(destinationIndex);
    for(var i = 0; i < colO.length; i++){
        if(colO[i] <= colD){
            col.push(colO[i]);
        }else{
            col.push(colD[i]);
        }
    }
    return col;
};

function addNewCol(originIndex, destinationIndex){
    var col = getNewCol(originIndex, destinationIndex);
    for (var i = 0; i < matrix.length; i++) {
        matrix[i].push(col[i]);
    }
};

function getCol(index){
    var col = [];
    for (var i = 0; i < matrix[0].length; i++) {
        col.push(matrix[i][index]);
    }
    return col;
};

function getRow(index){
    return matrix[index];
};

function removeRow(index) {
    matrix.splice(index,1);          
    clusters.splice(index,1);                        
};

function removeCol(index){
    for (var i = 0; i < matrix.length; i++) {                
        matrix[i].splice(index,1);
    }
};

function findIndexRow(value){
    for (var i = 0; i < clusters.length; i++) {
        if(clusters[i] === value){
            return i;
        }
    }
};

function createMatrix(n){
    var matrix = [];
    for(var i = 0; i < n; i++) {
        matrix[i] = new Array(n);
    }
    return initMatrix(matrix);
};

function initMatrix(matrix){
    for(var i = 0; i < matrix.length; i++) {
        matrix[i] = [];        
        for(var j = 0; j < matrix.length; j++) {            
            if(i !== j){
                matrix[i][j] = 0;
            }else{
                matrix[i][j] = undefined;
            }                   
        }
    }
    return matrix;
};

function copytMatrix(matrix){
    var copy = new Array(matrix.length);
    for(var i = 0; i < copy.length; i++) {
        copy[i] = [];        
        for(var j = 0; j < copy.length; j++) { 
                var value =  matrix[i][j];                      
                copy[i][j] = value;
        }
    }
    return copy;
};

function printMatrix(matrix) {
    var n = matrix.length;
    var m = matrix[0].length;
    for (var i = 0; i < n; i++) {
        var s = "| ";
        for (var j = 0; j < m; j++) {
            s = s + matrix[i][j] + " | ";                   
        }
        console.log(s);
    }
};

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
};

function generateDistanceRequestArray(){
    var cont = 0;    
    for (var i = 0; i < cities.length; i++) {                                            
        for (var j = i + 1; j < cities.length; j++) {                        
            cont++;                
        }
    }    
    distanceArray = new Array(cont);
    cont = 0;
    for (var i = 0; i < cities.length; i++) {                                            
        for (var j = i + 1; j < cities.length; j++) {                        
            var obj = {
                "origin": cities[i],
                "destination": cities[j],
                "i": i,
                "j": j
            }            
            distanceArray[cont] = obj;           
            cont++;
        }
    }    
    submitDistanceRequests();
}

function submitDistanceRequests(){    
    var service = new google.maps.DistanceMatrixService;   
    requestLength = distanceArray.length
    if(requestLength != 0) {            
        var service = new google.maps.DistanceMatrixService;
        service.getDistanceMatrix({
            origins: [distanceArray[0].origin],
            destinations: [distanceArray[0].destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        }, distanceResults);            
    }
} 

function distanceResults(response, status) {  
    var service = new google.maps.DistanceMatrixService;     
    if (status !== google.maps.DistanceMatrixStatus.OK) {
        //console.log('Error was: ' + status);
        if(status === "OVER_QUERY_LIMIT"){
            //console.log("Estoy durmiendo por que me pase");                
            //sleepFor(5*1000); 
            curDistance--;
            console.log("esperando 5 segundos .....");            
            sleepFor(5000);
            if(curDistance < distanceArray.length){
                service.getDistanceMatrix({
                    origins: [distanceArray[curDistance].origin],
                    destinations: [distanceArray[curDistance].destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                    avoidHighways: false,
                    avoidTolls: false
                }, distanceResults);
            }
        }

    } else {
        var originList = response.originAddresses;
        var destinationList = response.destinationAddresses;                          
        var indexI = distanceArray[curDistance].i;
        var indexJ = distanceArray[curDistance].j;                                  
        for (var i = 0; i < originList.length; i++) {
            var results = response.rows[i].elements;                                    
            for (var j = 0; j < results.length; j++) {    
                curDistance++;                
                if(results[j].status === "ZERO_RESULTS"){                                                               
                    matrix[indexI][indexJ] = undefined;
                    matrix[indexJ][indexI] = undefined;
                }else{
                    if(results[j].distance.value !== 0){
                        matrix[indexI][indexJ] = results[j].distance.value;                                                      
                        matrix[indexJ][indexI] = results[j].distance.value;                                                      
                    }else{
                        matrix[indexI][indexJ] = undefined;
                        matrix[indexJ][indexI] = undefined;  
                    }                        
                }
            }
        }       
        if((indexI === matrix.length - 2) && (indexJ === matrix.length - 1)){                
            originalMatrix = copytMatrix(matrix);                                
            console.log("imprimiendo matriz");
            printMatrix(matrix);
            hirarchicalClustering();
        }else{
            if(curDistance < distanceArray.length){
                service.getDistanceMatrix({
                    origins: [distanceArray[curDistance].origin],
                    destinations: [distanceArray[curDistance].destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                    avoidHighways: false,
                    avoidTolls: false
                }, distanceResults);
            }
        }           
    }
}



String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
};

function replaceAt(str, index, character){
    return str.substr(0, index) + character + str.substr(index+character.length);
}

function runAll(){    
    var sel = document.getElementById("fireBaseFiles");
    var val = sel.options[sel.selectedIndex].value;
    if(val !== -1 ){
        cities = fireBaseFiles[val];
    }
    if(fileText !== undefined){
        cities = fileText.split(/\r\n|\n/);                           
    }    
    if(cities[cities.length-1] === ""){
        cities.splice(-1,1);
    }       
    for (var i = 0; i < cities.length; i++) {
        if(cities[i].indexOf("�") > -1){
            cities[i] = replaceAt(cities[i], cities[i].indexOf("�"), "ñ");            
        }
        console.log("#" + i + ": " + cities[i]);
    }    
    if(openAFile){
        sendFileToFireBase(cities);
    }
    setMarkers();         
    matrix = createMatrix(cities.length);
    n = matrix.length;
    m = matrix[0].length;
    generateDistanceRequestArray();    
}

function setMarkers(){
    submitMarkersRequests();    
}

function submitMarkersRequests(){
    var geocoder = geocoder = new google.maps.Geocoder();
    requestLength = cities.length
    if(requestLength != 0) {        
        geocoder.geocode( { 'address': cities[0]}, markersResults);
    }
}

function markersResults(results, status){
    var geocoder = geocoder = new google.maps.Geocoder();
    if (status == google.maps.GeocoderStatus.OK) {                
        map.setCenter(results[0].geometry.location);                
        var marker = new google.maps.Marker({
            map: map,
            label: results[0].formatted_address,
            position: results[0].geometry.location
        });
        curMarker++;
        if(curMarker < cities.length){
            geocoder.geocode( { 'address': cities[curMarker]}, markersResults);    
        }        
    } else {
        console.log('Geocode was not successful for the following reason: ' + status);
        if(status === "OVER_QUERY_LIMIT"){
            console.log("esperando 5 segundos .....");
            curMarker--;
            sleepFor(5000);
        }        
        if (cur < requestLength) {
            geocoder.geocode( { 'address': cities[curMarker]}, markersResults);
        }
    }
}

function submitRequests(){
    var directionsService = new google.maps.DirectionsService();    
    requestLength = requestArray.length
    if(requestLength != 0) {        
        directionsService.route(requestArray[0], directionResults);
    }
}

function generateRequestArray(routes){
    renderArray = new Array(routes.length);
    for (var i = 0; i < routes.length; i++) {        
        requestArray.push({
            origin: routes[i].origin,
            destination: routes[i].destination,
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        });
    }
    submitRequests();
}

function directionResults(result, status) {    
    var directionsService = new google.maps.DirectionsService();
    if (status == google.maps.DirectionsStatus.OK) {
        var rand = Math.floor(Math.random()*colors.length);
        var polylineOptionsActual = new google.maps.Polyline({
            strokeColor: colors[rand],
            strokeOpacity: 0.9,
            strokeWeight: 5
        });
        renderArray[cur] = new google.maps.DirectionsRenderer({polylineOptions: polylineOptionsActual, suppressMarkers: true});
        renderArray[cur].setMap(map);
        renderArray[cur].setDirections(result);
        cur++        
        if (cur < requestLength) {
            directionsService.route(requestArray[cur], directionResults);
        }
    } else {
        console.log(status)
        if(status === "OVER_QUERY_LIMIT"){
            console.log("esperando 5 segundos .....");
            cur--;
            sleepFor(5000);
        }        
        if (cur < requestLength) {
            directionsService.route(requestArray[cur], directionResults);
        }
    }
}
