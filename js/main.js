var map;
var geocoder;
var vancouver = new google.maps.LatLng(49.2667,-123.1667);

function initialize() {
	var mapOptions = {
	    center: vancouver,
	   	zoom: 12
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	requestMapMarkers();
}

function requestMapMarkers() {
	$.ajax({
        type: "GET",
        //dataType: "json",
        url: 'php/request.php?location=' + 'Vancouver, BC',
        success: function(data){
        	dataObject = JSON.parse(data);
        	//console.log(dataObject);
           	var numberOfLocations = dataObject.businesses.length;
           	var i;
           	for (i = 0; i < numberOfLocations; i++) {
           		vm.mapLocations.push( new googleMapLocation(dataObject.businesses[i]));
           	}
           	createMapMarkers();
        }
    });
}

// Location Template
var googleMapLocation = function(data) {
	this.title = ko.observable(data.name),
	this.latitude = data.location.coordinate.latitude,
	this.longitude = data.location.coordinate.longitude,
	this.address = ko.observable(),
	this.photos = ko.observableArray(),
	this.marker = ko.observable(),
	this.mainImage = ko.observable(data.image_url.replace("ms","l")),
	this.review = ko.observable(data.snippet_text),
	this.stars = ko.observable(data.rating_img_url),
	this.reviewCount = ko.observable(data.review_count),
	this.yelpLink = ko.observable(data.url),
	this._destroy = ko.observable(false)
}

function createMapMarkers() {
	var i;
	var numberOfLocations = vm.mapLocations().length;
	var currentMarker;
	for (i = 0; i < numberOfLocations; i++) {
		currentMarker = vm.mapLocations()[i];
		currentMarker.coordinates = new google.maps.LatLng(currentMarker.latitude,currentMarker.longitude);
		var marker = new google.maps.Marker({
		    map: map,
		    animation: google.maps.Animation.DROP,
		    position: currentMarker.coordinates
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


		// Get address based on yelp coordinates and set to currentMapMarker's address
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'location': self.currentMapMarker().coordinates}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
	        self.currentMapMarker().address(results[0].formatted_address);
	      } else {
	        alert("Geocode was not successful for the following reason: " + status);
	      }
	    });

	    lat = self.currentMapMarker().marker().position.A;
	    lng = self.currentMapMarker().marker().position.F;
	    formattedInstaURL = 'https://api.instagram.com/v1/media/search?lat=' + lat + '&lng=' + lng + '&distance=500&client_id=' + instaID;
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