var map;

function findMapMarkers() {
	var numberOfLocations = vm.mapLocations().length;
	for (i = 0; i< numberOfLocations; i++) {
		vm.mapLocations()[i].locationInfo = 
	    '<h1>' + vm.mapLocations()[i].title + '</h1>' +
	    '<ul data-bind="foreach: instagramPhotos">' +
	    '<li data-bind="text: $data"></li>' +
	    '</ul>';
		requestMapMarker(vm.mapLocations()[i]);
	}
}

function requestMapMarker(initialLocation) {
	var request;
	var service = new google.maps.places.PlacesService(map);
	// the search request object
	request = {
		query: initialLocation.title() + ' in Vancouver, BC'
	};

	service.textSearch(request, function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
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
	loc.address(placeData.formatted_address);
	    
	google.maps.event.addListener(loc.marker, 'click', function() {
		vm.openInfoWindow(loc);
	});
}

function initialize() {
	var mapOptions = {
	    center: { lat: 49.2667, lng: -123.1667},
	   	zoom: 12
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	findMapMarkers();
}

function viewModel() {
	var self = this;

	self.mapLocations = ko.observableArray([
		{
			title: ko.observable('Lighthouse Park'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Granville Island'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Granville Street Bridge'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Gastown Steam Clock'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Burrard Street Bridge'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Portside Park'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Canada Place'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Stanley Park'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Lions Gate Bridge'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Olympic Village'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('Kitsilano'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
		{
			title: ko.observable('UBC'),
			address: ko.observable(),
			photos: ko.observableArray(),
			_destroy: ko.observable(false)
		},
	]);

	self.searchTerm = ko.observable('');

	self.updateLocations = function() {
		self.mapLocations().forEach(function(entry) {
			//console.log(entry.title.indexOf(self.searchTerm()));
			if (entry.title().toLowerCase().indexOf(self.searchTerm().toLowerCase()) >= 0 ||
				self.searchTerm() == '') {
				entry._destroy(false);
				entry.marker.setVisible(true);
			} else {
				entry._destroy(true);
				entry.marker.setVisible(false);
			}
			
		});
	};

	var lat,
		lng,
		formattedInstaURL,
		instagramPhotoArray,
		numberOfInstagramPhotos;

	var instaID = '65450f0c27544afaa1a64a11b40d0611';
	self.currentMapMarker = ko.observable({
		title: ko.observable(),
		photos: ko.observableArray(),
		address: ko.observable()
	});
	self.infoWindow = ko.observable('');

	self.openInfoWindow = function(mapMarker) {
		self.currentMapMarker(mapMarker);
		// Clear the current Instagram photo array and close the previous infoWindow
		//self.instagramPhotos().length = 0;
		//
		if (self.infoWindow() != '') {
			self.infoWindow().close();
		}

		self.infoWindow(
			new google.maps.InfoWindow({
				content: $('#info-window-template').html(),
				maxWidth: 800
			}));
		self.infoWindow().open(map, self.currentMapMarker().marker);
		self.currentMapMarker().marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			self.currentMapMarker().marker.setAnimation(google.maps.Animation.null);
		}, 2100);

	    lat = mapMarker.marker.position.A;
	    lng = mapMarker.marker.position.F;
	    formattedInstaURL = 'https://api.instagram.com/v1/media/search?lat=' + lat + '&lng=' + lng + '&distance=1000&client_id=' + instaID;
	    //console.log(lat + ', ' + lng);
	    

	    $.ajax({
			type: "GET",
			dataType: "jsonp",
			url: formattedInstaURL,
			success: function(data) {
				self.displayInstaPhotos(data.data);
			}
		});
	};

	self.displayInstaPhotos = function(photos) {
		self.currentMapMarker().photos([]);
		photos.sort(function(a, b) {
			return b.likes.count - a.likes.count;
		});
		instagramPhotoArray = photos.slice(0,8);

		numberOfInstagramPhotos = instagramPhotoArray.length;
		for (i = 0; i < numberOfInstagramPhotos; i++) {
			self.currentMapMarker().photos.push(instagramPhotoArray[i]);
		}

		self.infoWindow().setContent($('#info-window-template').html());
	};
}

window.vm = new viewModel();
ko.applyBindings(vm);

google.maps.event.addDomListener(window, 'load', initialize);