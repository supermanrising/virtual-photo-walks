var map;
var geocoder;
var mapLocation;
var bounds = new google.maps.LatLngBounds();

function initialize(lat,lng) {
	$("#splash").fadeOut();
	$("#app").css({
  		display: "inline"
	});
	mapLocation = new google.maps.LatLng(lat,lng);
	var mapOptions = {
	    center: mapLocation,
	   	zoom: 12,
	   	zoomControlOptions: {
	        position: google.maps.ControlPosition.LEFT_BOTTOM
	    },
	    panControlOptions: {
	        position: google.maps.ControlPosition.LEFT_BOTTOM
	    }
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	requestMapMarkers(lat,lng);
}

/* This function offets the map based on the height of the infoWindow
 *  http://stackoverflow.com/questions/3473367/how-to-offset-the-center-of-a-google-maps-api-v3-in-pixels
 */

google.maps.Map.prototype.setCenterWithOffset= function(latlng, offsetX, offsetY) {
    var map = this;
    var ov = new google.maps.OverlayView();
    ov.onAdd = function() {
        var proj = this.getProjection();
        var aPoint = proj.fromLatLngToContainerPixel(latlng);
        aPoint.x = aPoint.x+offsetX;
        aPoint.y = aPoint.y+offsetY;
        map.panTo(proj.fromContainerPixelToLatLng(aPoint));
    }; 
    ov.draw = function() {}; 
    ov.setMap(this); 
};

function requestMapMarkers(lat,lng) {
	$.ajax({
        type: "GET",
        url: 'php/request.php?lat=' + lat + '&lng=' + lng,
        success: function(data){
        	dataObject = JSON.parse(data);
        	if (dataObject.hasOwnProperty('error')) {
        		//backup to google places search
        		var request = {
				    location: mapLocation,
				    radius: '20000',
				    types: ['amusement_park','church','zoo','stadium','park','museum','campground','hindu_temple']
				};
				var service = new google.maps.places.PlacesService(map);
				service.nearbySearch(request, callback);

				function callback(results, status) {
					if (status == google.maps.places.PlacesServiceStatus.OK) {
				    	console.log(results);
				    	var numberOfLocations = results.length;
	           			var i;
				    	for (i = 0; i < numberOfLocations; i++) {
			           		vm.mapLocations.push( new googlePlacesLocation(results[i]));
			           	}
			           	createMapMarkers();
					}
				}
        	} else {
	           	var numberOfLocations = dataObject.businesses.length;
	           	var i;
	           	for (i = 0; i < numberOfLocations; i++) {
	           		vm.mapLocations.push( new googleMapLocation(dataObject.businesses[i]));
	           	}
	           	createMapMarkers(fitMapToBounds);
	       	}
        }
    });
}

// Location Template
var googleMapLocation = function(data) {
	this.title = ko.observable(data.name),
	this.location = data.location,
	this.address = ko.observable(),
	this.photos = ko.observableArray(),
	this.marker = ko.observable(),
	this.review = ko.observable(data.snippet_text),
	this.stars = ko.observable(data.rating_img_url),
	this.reviewCount = ko.observable(data.review_count),
	this.yelpLink = ko.observable(data.url),
	this._destroy = ko.observable(false)
}

// Location Template Backup for Google Places
var googlePlacesLocation = function(data) {
	this.title = ko.observable(data.name),
	this.latitude = data.geometry.location.A,
	this.longitude = data.geometry.location.F,
	this.address = ko.observable(data.vicinity),
	this.photos = ko.observableArray(),
	this.marker = ko.observable(),
	this.review = ko.observable(),
	this.stars = ko.observable(),
	this.reviewCount = ko.observable(),
	this.yelpLink = ko.observable(),
	this._destroy = ko.observable(false)
}

function createMapMarkers(callback) {
	var i;
	var numberOfLocations = vm.mapLocations().length;
	var currentMarker;
	for (i = 0; i < numberOfLocations; i++) {
		currentMarker = vm.mapLocations()[i];
		// Do inside function so it sets scope on currentMarker variable
		setTheMarker(currentMarker,fitMapToBounds);
		
		function setTheMarker(currentMapMarker) {
			if (currentMapMarker.hasOwnProperty('latitude')) {
				currentMapMarker.coordinates = new google.maps.LatLng(currentMapMarker.latitude,currentMapMarker.longitude);
				var marker = new google.maps.Marker({
				    map: map,
				    animation: google.maps.Animation.DROP,
				    position: currentMapMarker.coordinates
				});
				currentMapMarker.marker(marker);
				createEventListener(currentMapMarker);
				bounds.extend(currentMapMarker.coordinates);
			} else if (currentMapMarker.location.hasOwnProperty("coordinate")) {
				currentMapMarker.coordinates = new google.maps.LatLng(currentMapMarker.location.coordinate.latitude,currentMapMarker.location.coordinate.longitude);
				var marker = new google.maps.Marker({
				    map: map,
				    animation: google.maps.Animation.DROP,
				    position: currentMapMarker.coordinates
				});
				currentMapMarker.marker(marker);
				createEventListener(currentMapMarker);
				bounds.extend(currentMapMarker.coordinates);
			} else {
				var request = {
				    location: mapLocation,
				    radius: '20000',
				    query: currentMapMarker.title()
				};
				var service = new google.maps.places.PlacesService(map);
				service.textSearch(request, googleCallback);

				function googleCallback(results, status) {
					if (status == google.maps.places.PlacesServiceStatus.OK) {
				    	currentMapMarker.coordinates = new google.maps.LatLng(results[0].geometry.location.A,results[0].geometry.location.F);
				    	var marker = new google.maps.Marker({
						    map: map,
						    animation: google.maps.Animation.DROP,
						    position: currentMapMarker.coordinates
						});
						currentMapMarker.marker(marker);
						createEventListener(currentMapMarker);
						bounds.extend(currentMapMarker.coordinates);
					}
				}
			}
			
		}
		/*$.when( setTheMarker() ).done(function() {
       		map.fitBounds(bounds);
		});*/
	}
	callback();
}

function fitMapToBounds() {
	map.fitBounds(bounds);
}

function createEventListener(currentMarker) {
	google.maps.event.addListener(currentMarker.marker(), 'click', function() {
		vm.openInfoWindow(currentMarker);
	});
}

function viewModel() {
	var self = this;

	self.mapLocations = ko.observableArray([]);

	self.locationSearch = ko.observable('');

	self.checkLocation = function() {
		self.mapLocations.removeAll();
		bounds = new google.maps.LatLngBounds();
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address': self.locationSearch()}, function(results, status) {
	    	if (status == google.maps.GeocoderStatus.OK) {
	       		var latitude = results[0].geometry.location.A;
	       		var longtitude = results[0].geometry.location.F;
	       		initialize(latitude, longtitude);
	       		//console.log(results);
	      	} else {
	        	alert("Sorry!  We didn't recognize that location.  Please try again!");
	      	}
	    });
		//initialize();
	};

	self.toggleList = function() {
		$('#list-view').animate({width: 'toggle'});
		if ($('.relative').css('left') === '300px') {
			$('.relative').animate({left: '0'});
		} else {
			$('.relative').animate({left: '300px'});
		}
	};

	self.showList = function() {
		if ($('#list-view').css('display') === 'none') {
			$('#list-view').animate({width: 'toggle'});
		}
		$('.relative').animate({left: '300px'});
	};

	self.toggleBgHover = function(currentListItem) {
		document.getElementById(currentListItem).style.backgroundColor = "#f3f3f3";
	};

	self.toggleBgLeave = function(currentListItem) {
		document.getElementById(currentListItem).style.backgroundColor = "#fff";
	};

	self.searchTerm = ko.observable('');

	self.updateLocations = function() {
		// Close current infoWindow
		if (self.infoWindow() != '') {
			self.infoWindow().close();
		}

		self.mapLocations().forEach(function(entry) {
			//console.log(entry.title().indexOf(self.searchTerm()));
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
				maxWidth: 800,
				disableAutoPan: true
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

		var infoWindowHeight = $('#info-window-template').height();
		map.setCenterWithOffset(self.currentMapMarker().coordinates, 0, (infoWindowHeight - 330) * -1);
	};
}

window.vm = new viewModel();
ko.applyBindings(vm);

//google.maps.event.addDomListener(window, 'load', initialize);