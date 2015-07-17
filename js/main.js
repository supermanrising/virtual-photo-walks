var map;
var vancouver = new google.maps.LatLng(49.2667,-123.1667);

function initialize() {
	var mapOptions = {
	    center: vancouver,
	   	zoom: 11
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	requestMapMarkers();
}

function requestMapMarkers() {
	var request = {
	    location: vancouver,
	    radius: '20000',
	    types: ['amusement_park','campground','hindu_temple','library','museum','park','university','zoo']
	};
	var service = new google.maps.places.PlacesService(map);

	service.nearbySearch(request, callback);

	function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			results.forEach(function(mapItem) {
				vm.mapLocations.push( new googleMapLocation(mapItem) );
			});
			createMapMarkers();
		} else {
			console.log(status);
		}
	}
}

// Location Template
var googleMapLocation = function(data) {
	this.title = ko.observable(data.name),
	this.position = data.geometry.location,
	this.address = ko.observable(data.vicinity),
	this.photos = ko.observableArray(),
	this.marker = ko.observable();
	this._destroy = ko.observable(false)
}

function createMapMarkers() {
	var i;
	var numberOfLocations = vm.mapLocations().length;
	var currentMarker;
	for (i = 0; i < numberOfLocations; i++) {
		currentMarker = vm.mapLocations()[i];
		var marker = new google.maps.Marker({
		    map: map,
		    animation: google.maps.Animation.DROP,
		    position: currentMarker.position
		});
		currentMarker.marker(marker);
		createEventListener(currentMarker);
	}
}

function createEventListener(currentMarker) {
	google.maps.event.addListener(currentMarker.marker(), 'click', function() {
		vm.openInfoWindow(currentMarker);
	});
}

function viewModel() {
	var self = this;

	self.mapLocations = ko.observableArray([]);

	self.searchTerm = ko.observable('');

	self.updateLocations = function() {
		self.mapLocations().forEach(function(entry) {
			console.log(entry.title().indexOf(self.searchTerm()));
			if (entry.title().toLowerCase().indexOf(self.searchTerm().toLowerCase()) >= 0 ||
				self.searchTerm() == '') {
				entry._destroy(false);
				entry.marker().setVisible(true);
			} else {
				entry._destroy(true);
				entry.marker().setVisible(false);
			}
			
		});
	};

	var lat,
		lng,
		formattedInstaURL,
		instagramPhotoArray,
		numberOfInstagramPhotos;

	var instaID = '65450f0c27544afaa1a64a11b40d0611';
	self.currentMapMarker = ko.observable();
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
		self.infoWindow().open(map, self.currentMapMarker().marker());
		self.currentMapMarker().marker().setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			self.currentMapMarker().marker().setAnimation(google.maps.Animation.null);
		}, 2100);

	    lat = self.currentMapMarker().marker().position.A;
	    lng = self.currentMapMarker().marker().position.F;
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