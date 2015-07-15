var map;

function findMapMarkers() {
	var numberOfLocations = vm.mapLocations().length;
	for (i = 0; i< numberOfLocations; i++) {
		vm.mapLocations()[i].locationInfo = 
	    '<h1>' + vm.mapLocations()[i].title + '</h1>' +
	    '<p><b>' + vm.mapLocations()[i].address + '</b></p>';
		requestMapMarker(vm.mapLocations()[i]);
	}
}

function requestMapMarker(initialLocation) {
	var request;
	var service = new google.maps.places.PlacesService(map);
	// the search request object
	request = {
		query: initialLocation.title + ' in Kitsilano, Vancouver, BC'
	};
	console.log(request.query);

	service.textSearch(request, function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			console.log(results);
	    	createMapMarker(results[0], initialLocation);
	    } else {
	    	console.log('failed: ' + status);
	    }
	});
}

function createMapMarker(placeData, loc) {
	var marker = new google.maps.Marker({
	    map: map,
	    animation: google.maps.Animation.DROP,
	    position: placeData.geometry.location,
	});
	loc.marker = marker;
	    
	google.maps.event.addListener(loc.marker, 'click', function() {
		vm.openInfoWindow(loc);
	});
}

function initialize() {
	var mapOptions = {
	    center: { lat: 49.2667, lng: -123.1667},
	   	zoom: 13
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	findMapMarkers();
}

function viewModel() {
	var self = this;

	self.mapLocations = ko.observableArray([
		{
			title: 'East Is East',
			category: 'Restaurant',
			address: '3243 W Broadway, Vancouver',
			marker: {},
			_destroy: ko.observable(false)
		},
		{
			title: 'Hitoe Sushi',
			category: 'Restaurant',
			address: '3347 W 4th Avenue, Vancouver',
			marker: {},
			_destroy: ko.observable(false)
		}
	]);

	self.searchTerm = ko.observable('');

	self.updateLocations = function() {
		self.mapLocations().forEach(function(entry) {
			//console.log(entry.title.indexOf(self.searchTerm()));
			if (entry.title.toLowerCase().indexOf(self.searchTerm().toLowerCase()) >= 0 ||
				entry.category.toLowerCase().indexOf(self.searchTerm().toLowerCase()) >= 0 ||
				self.searchTerm() == '') {
				entry._destroy(false);
				entry.marker.setVisible(true);
			} else {
				entry._destroy(true);
				entry.marker.setVisible(false);
			}
			
		});
	};

	var infoWindow,
		currentInfoWindow;

	self.openInfoWindow = function(mapMarker) {
		if (currentInfoWindow != null) {
			currentInfoWindow.close();
		}
		infoWindow = new google.maps.InfoWindow({
			content: mapMarker.locationInfo
		});
		currentInfoWindow = infoWindow;
		currentInfoWindow.open(map, mapMarker.marker);
		mapMarker.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			mapMarker.marker.setAnimation(google.maps.Animation.null);
		}, 2100);
	}
}

window.vm = new viewModel();
ko.applyBindings(vm);

google.maps.event.addDomListener(window, 'load', initialize);