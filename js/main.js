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
var requestArray = [];
var directionsService = new google.maps.DirectionsService();
var geocoder = geocoder = new google.maps.Geocoder();
var renderArray = []
var label = 0;
var fileText = "";


function readFile (evt) {    
   var files = evt.target.files;
   var file = files[0];           
   var reader = new FileReader();
   reader.onload = function() {     
     fileText = this.result;           
   }
   reader.readAsText(file)
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

function getOrder(argument){
    var order = [];         
    for(var i = 0; i < argument.length; i++){
        var last = 0;
        var char = argument.substring(i,i+1);
        if(char === "*"){                   
            if( argument.substring(i-2,i-1) === ","){
                for(var j = i; j > 0; j--){                     
                    if(argument.substring(j-1,j) === "("){
                        if(argument.substring(j,i-2) !== ""){
                            order.push(argument.substring(j,i-2));                              
                        }                                                           
                        argument = argument.replace(argument.substring(j-1,i+1),'');                                                            
                        i = 0;
                        break;
                    }
                }
            }else{
                for(var j = i; j > 0; j--){                     
                    if(argument.substring(j-1,j) === "("){                          
                        order.push(argument.substring(j,i-1));                          
                        argument = argument.replace(argument.substring(j-1,i+1),'');                                                            
                        i = 0;
                        break;
                    }
                }
            }
        }
    }
    return order;
}

function getRoutes(order){
    var routes = [];        
    if(order.length === 1){
        var points = order[0].split(',');
        if(points.length === 2){
            var obj = {
                        origin: cities[parseInt(points[0])],
                        destination: cities[parseInt(points[1])]
                    };
            if(!isObjectInArray(routes,obj)){routes.push(obj);}
        }
    }       
    while(order.length > 1){                    
        for (var i = 0; i < order.length; i++) {            
            var points = order[i].split(',');            
            if(points.length > 1){
                var sw = false;
                if(i !== 0){                            
                    var previusCluster = order[i-1].split(',');
                    if(i < order.length - 1){
                        var nextCluster = order[i+1].split(',');
                        if(nextCluster.length > 1 && previusCluster.length > 1){                                    
                            var origin = parseInt(points[0]);                               
                            var destination = parseInt(previusCluster[0]);
                            for (var k = 0; k < points.length; k++) {
                                for (var j = 0; j < previusCluster.length; j++) {
                                    if(originalMatrix[parseInt(points[k])][parseInt(previusCluster[j])] < originalMatrix[origin][destination]){
                                        origin = parseInt(points[k]);
                                        destination = parseInt(previusCluster[j]);
                                    }           
                                }                                       
                            }
                            var obj = {origin: cities[parseInt(origin)],
                                destination: cities[parseInt(destination)]};
                            if(!isObjectInArray(routes,obj)){routes.push(obj);}
                            order[i-1] += "," + order[i];
                            order.splice(i,1);
                            i = -1;
                        }
                    }
                    if(previusCluster.length > 1 && i === order.length - 1){                                
                        var origin = parseInt(points[0]);                               
                        var destination = parseInt(previusCluster[0]);
                        for (var k = 0; k < points.length; k++) {
                            for (var j = 0; j < previusCluster.length; j++) {                                       
                                if(originalMatrix[parseInt(points[k])][parseInt(previusCluster[j])] < originalMatrix[origin][destination]){
                                    origin = parseInt(points[k]);
                                    destination = parseInt(previusCluster[j]);
                                }           
                            }                                       
                        }
                        var obj = {origin: cities[parseInt(origin)],
                            destination: cities[parseInt(destination)]};
                        if(routes.indexOf(obj)===-1){routes.push(obj);}
                        order[i-1] += "," + order[i];
                        order.splice(i,1);
                        i = -1;
                    }                                                                           
                }                       
                if(points.length === 2){                            
                    var obj = {
                                origin: cities[parseInt(points[0])],
                                destination: cities[parseInt(points[1])]
                            };
                    if(!isObjectInArray(routes,obj)){routes.push(obj);}
                }else{

                }
                
            }else{                                
                var lastCluster = order[i-1].split(',');                                
                var min = parseInt(lastCluster[0]);
                for (var j = 1; j < lastCluster.length; j++) { 
                    if(originalMatrix[parseInt(lastCluster[j])][parseInt(points[0])] < originalMatrix[min][parseInt(points[0])]){
                        min = parseInt(lastCluster[j]);                        
                    }
                }
                routes.push({origin: cities[parseInt(points[0])],
                            destination: cities[min]});                                                  
                order[i-1] += ',' + order[i];
                order.splice(i,1);
                i = -1;
            }
        }
    }
    return routes;
}

function drawRoutes(argument) {
    var order = getOrder(argument);
    var routes = getRoutes(order);       
    for (var i = 0; i < routes.length; i++) {
        console.log(i + ": " + routes[i].origin + " - " + routes[i].destination);               
    }   
    generateRequestArray(routes);       
};  

function isObjectInArray(array, object){
    for (var i = 0; i < array.length; i++) {
        if((array[i].origin === object.origin && array[i].destination === object.destination) || (array[i].origin === object.destination && array[i].destination === object.origin)){
            return true;
        }
    }
    return false;
}

function hirarchicalClustering(){
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
        if(obj.value !== undefined){
            addCluster(origin, destination);    
        }        
        printMatrix(matrix);
    }
    printClusters();    
    for (var i = 0; i < clusters.length; i++) {  
        console.log("Rutas del Cluster #" + i + ": ");      
        drawRoutes(clusters[i]);
    }
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

function getDistance(origin, destination) {
            
    var geocoder = new google.maps.Geocoder;
    var service = new google.maps.DistanceMatrixService;

    service.getDistanceMatrix({
        origins: [origin.name],
        destinations: [destination.name],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function(response, status) {
        if (status !== google.maps.DistanceMatrixStatus.OK) {
            //console.log('Error was: ' + status);
            if(status === "OVER_QUERY_LIMIT"){
                //console.log("Estoy durmiendo por que me pase");                
                //sleepFor(5*1000); 
            }

        } else {
            var originList = response.originAddresses;
            var destinationList = response.destinationAddresses;                          

            var showGeocodedAddressOnMap = function(asDestination) {                
                return function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {                 
            
                    } else {
                        //console.log('Error was: ' + status);
                        if(status === "OVER_QUERY_LIMIT"){
                            //console.log("Estoy durmiendo por que me pase");                            
                            //sleepFor(5*1000); 
                        }                               
                    }
                };
            };                              
            for (var i = 0; i < originList.length; i++) {
                var results = response.rows[i].elements;                        
                geocoder.geocode({'address': originList[i]},
                showGeocodedAddressOnMap(false));
                for (var j = 0; j < results.length; j++) {
                    geocoder.geocode({'address': destinationList[j]},
                    showGeocodedAddressOnMap(true));                                                                                                                                        
                    if(results[j].status === "ZERO_RESULTS"){                                                               
                        matrix[origin.i][origin.j] = undefined;
                        matrix[origin.j][origin.i] = undefined;
                    }else{
                        if(results[j].distance.value !== 0){
                            matrix[origin.i][origin.j] = results[j].distance.value;                                                      
                            matrix[origin.j][origin.i] = results[j].distance.value;                                                      
                        }else{
                            matrix[origin.i][origin.j] = undefined;
                            matrix[origin.j][origin.i] = undefined;  
                        }                        
                    }
                }
            }       
            if((origin.i === matrix.length - 2) && (origin.j === matrix.length - 1)){                
                originalMatrix = copytMatrix(matrix);                                
                console.log("imprimiendo matriz");
                printMatrix(matrix);
                hirarchicalClustering();
            }           
        }
    });
};  

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
};

function replaceAt(str, index, character){
    return str.substr(0, index) + character + str.substr(index+character.length);
}

function runAll(){    
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

    setMarkers();         
    matrix = createMatrix(cities.length);
    n = matrix.length;
    m = matrix[0].length;
    for (var i = 0; i < n; i++) {                                            
        for (var j = i + 1; j < m; j++) {
            var origin = {"name": cities[i],"i":i, "j":j};
            var destination = {"name": cities[j],"i":i, "j":j}; 
            getDistance(origin, destination);                     
        }
    }           
}

function setMarkers(){
    var geocoder = geocoder = new google.maps.Geocoder();
    var label = 0;
    for (var i = 0; i < cities.length; i++) {        
        geocoder.geocode( { 'address': cities[i]}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {                
                map.setCenter(results[0].geometry.location);
                var text = label+""
                var marker = new google.maps.Marker({
                    map: map,
                    label: text,
                    position: results[0].geometry.location
                });
                label++;
            } else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
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
