var map;
var geocoder = new google.maps.Geocoder();

function initialize() {
    var mapOptions = {
    	center: { lat: 49.2667, lng: -123.1667},
    	zoom: 13
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    findMapMarkers();
}
google.maps.event.addDomListener(window, 'load', initialize);

var initialLocations = [
	{
		title: 'East Is East',
		category: 'Restaurant',
		address: '3243 W Broadway, Vancouver',
		coordinates: {}
	},
	{
		title: 'Hitoe Sushi Japanese',
		category: 'Restaurant',
		address: '3347 W 4th Avenue, Vancouver',
		coordinates: {}
	}
]


function findMapMarkers() {
	var service = new google.maps.places.PlacesService(map);
	var request;

	for (var place in initialLocations) {
	    // the search request object
	    request = {
	    	query: initialLocations[place].address
	    };

	    service.textSearch(request, callback);
	}
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
    	//console.log(results[0]);
    	createMapMarker(results[0]);
    }
}

function createMapMarker(placeData) {
    var marker = new google.maps.Marker({
      map: map,
      animation: google.maps.Animation.DROP,
      position: placeData.geometry.location,
    });    
/*
    google.maps.event.addListener(marker, 'click', function() {
      infoWindow.open(map,marker);
    });
*/

}