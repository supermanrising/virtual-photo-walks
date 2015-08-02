/* This file contains main Javascript for Virtual Photo Walks
 * It utilizes the knockout.js, jquery.autocomplete.js & photoswipe javascript libraries
 * @author Ryan Vrba ryan.vrba@gmail.com
 */


// Global Google Map variables
var map;
var geocoder;
var mapLocation;		// Location defined by user
var bounds = new google.maps.LatLngBounds();		// Map bounds to be set based on map marker coordinates

// Global Photoswipe variables
var photoSwipeItems = [];		// array to hold objects for photoswipe gallery
var pswpElement = document.querySelectorAll('.pswp')[0];		// Select photoswipe element from DOM
var psOptions;		// Photoswipe options to be defined

/**
  * @desc This function fades out the splash intro page and initilaizes the Google Map
  * @param {string} lat - The latitude (defined by geocoded location entered by user)
  * @param {string} lng - The longitude (defined by geocoded location entered by user)
  */
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

/** @desc This function centers the Google map with an offset X and Y value
  * http://stackoverflow.com/questions/3473367/how-to-offset-the-center-of-a-google-maps-api-v3-in-pixels
  * @param {google.maps.latlng} latlng - The center point to offset
  * @param {number} offsetX - Pixels to offset X coordinate
  * @param {number} offsetY - Pixels to offset Y coordinate
  */
google.maps.Map.prototype.setCenterWithOffset = function(latlng, offsetX, offsetY) {
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

/** @desc Request photo walk locations from Yelp.com
  * Sends ajax request to php/request.php
  * If Yelp returns 0 results, uses Google places as a backup
  * @param {number} lat - The latitude of the current Google map location
  * @param {number} lng - The longitude of the current Google map location
  */
function requestMapMarkers(lat,lng) {
	$.ajax({
        type: "GET",
        url: 'php/request.php?lat=' + lat + '&lng=' + lng,
        success: function(data){
        	dataObject = JSON.parse(data);

        	// If Yelp returns error, use Google places
        	if (dataObject.hasOwnProperty('error')) {
        		var request = {
				    location: mapLocation,
				    radius: '20000',
				    types: ['amusement_park','church','zoo','stadium','park','museum','campground','hindu_temple']
				};
				var service = new google.maps.places.PlacesService(map);
				service.nearbySearch(request, callback);

				function callback(results, status) {
					if (status == google.maps.places.PlacesServiceStatus.OK) {
				    	var numberOfLocations = results.length;
	           			var i;

	           			// Push Google locations to vm.mapLocations observableArray
				    	for (i = 0; i < numberOfLocations; i++) {
			           		vm.mapLocations.push( new googlePlacesLocation(results[i]));
			           	}

			           	// Sort vm.mapLocations alphabetically
			           	vm.mapLocations.sort(function(left, right) {
			           		return left.title() == right.title() ? 0 : (left.title() < right.title() ? -1 : 1);
			           	});

			           	createMapMarkers();

					} else {
						alert("Oops!  Looks like we couldn't find any photo walking areas in this location.\nTry a different location or get our there and explore for yourself!");
					}
				}
        	} else { // If Yelp returns locations
	           	var numberOfLocations = dataObject.businesses.length;
	           	var i;

	           	// Push Google locations to vm.mapLocations observableArray
	           	for (i = 0; i < numberOfLocations; i++) {
	           		vm.mapLocations.push( new googleMapLocation(dataObject.businesses[i]));
	           	}

	           	// Sort vm.mapLocations alphabetically
	           	vm.mapLocations.sort(function(left, right) {
			        return left.title() == right.title() ? 0 : (left.title() < right.title() ? -1 : 1);
			    });

	           	createMapMarkers();
	       	} // end if statement
        } // end success function
    }); // end ajax
} // end requestMapMarkers

/** @constructor
  * Constructor for Google map location using Yelp data
  * @param {object} data - location object returned from Yelp API
  * @property {string} title - title of the map location
  * @property {object} location - location object, possibly including coordinates
  * @property {string} address - address of the map location
  * @property {array} photos - array of Instagram photos
  * @property {object} marker - Google map marker object
  * @property {string} review - Yelp review snippet
  * @property {string} stars - url of Yelp stars image
  * @property {number} reviewCount - number of Yelp reviews
  * @property {string} yelpLink - url of location's Yelp page
  * @property {string} category - yelp category
  * @property {boolean} _destory - boolean to hide / show list item
  */
var googleMapLocation = function(data) {
	this.title = ko.observable(data.name);
	this.location = data.location;
	this.address = ko.observable();
	this.photos = ko.observableArray();
	this.marker = ko.observable();
	this.review = ko.observable(data.snippet_text);
	this.stars = ko.observable(data.rating_img_url);
	this.reviewCount = ko.observable(data.review_count);
	this.yelpLink = ko.observable(data.url);
	this.category = ko.observable(data.categories[0][1]);
	this._destroy = ko.observable(false);
	this.showReview = ko.observable(false);
	this.showStars = ko.observable(false);
};

/** @constructor
  * Constructor for Google map location using Google Places data
  * @param {object} data - location data returned from Google places
  * @property {string} title - title of the map location
  * @property {array} locCoors - array to hold latitude and longitude
  * @property {number} latitude - location latitude
  * @property {number} longitude - location longitude
  * @property {string} address - address of the map location
  * @property {array} photos - array of Instagram photos
  * @property {object} marker - Google map marker object
  * @property {string} review - Yelp review snippet, always empty
  * @property {string} stars - url of Yelp stars image, always empty
  * @property {number} reviewCount - number of Yelp reviews, always empty
  * @property {string} yelpLink - url of location's Yelp page, always empty
  * @property {string} category - yelp category, null
  * @property {boolean} _destory - boolean to hide / show list item
  */
var googlePlacesLocation = function(data) {
	this.title = ko.observable(data.name);

	/** Access location coordinates by iterating over Key/Value pairs in the 'location' object returned by Google and push them to an array
	  * I do it this way because Google changed the name of the coordinate keys while in developement stages
	  * This way, if Google changes key names again, the app won't break
	  */
	this.locCoors = [];
	for( var key in data.geometry.location ) {
		if ( data.geometry.location.hasOwnProperty(key) ) {
		    this.locCoors.push(data.geometry.location[key]);
		}
	}

	this.latitude = this.locCoors[0];		// first value in locCoors array
	this.longitude = this.locCoors[1];		// second value in locCoors array
	this.address = ko.observable(data.vicinity);
	this.photos = ko.observableArray();
	this.marker = ko.observable();
	this.review = ko.observable();			// not used, but defined because some functions may request it
	this.stars = ko.observable();			// not used, but defined because some functions may request it
	this.reviewCount = ko.observable();		// not used, but defined because some functions may request it
	this.yelpLink = ko.observable();		// not used, but defined because some functions may request it
	this.category = ko.observable(null);
	this._destroy = ko.observable(false);
	this.showReview = ko.observable(false);
	this.showStars = ko.observable(false);
};

/** @constructor
  * Constructor for Photoswipe gallery image
  * @param {object} data - image data returned from Instagram API
  * @property {string} src - url of the image
  * @property {string} w - width of the image
  * @property {string} h - height of the image
  * @property {string} title - caption of the image
  * @property {string} username - Instagram photographer
  */
var galleryPhoto = function(data) {
	this.src = data.images.standard_resolution.url;
	this.w = data.images.standard_resolution.width;
	this.h = data.images.standard_resolution.height;

	// Get caption data if caption exists
	if (data.caption !== null) {
		this.title = data.caption.text;
	}

	this.username = data.user.username;
};

/** @desc Create map markers
  * This function is called by requestMapMarkers() after recieving location data from either Yelp or Google places
  */
function createMapMarkers() {
	// Set variables to be used within loop
	var i;  				// increment variable
	var numberOfLocations = vm.mapLocations().length;
	var currentMarker;		// current location updated each time in the loop
	var searchItem;			// search object created from currentMarker
	var markerIcon = {		// the marker icon, url is defined from location category
		url: "",
		// This marker is 35 pixels wide by 41 pixels tall.
		size: new google.maps.Size(35, 41),
		// The origin for this image is 0,0. (top left)
		origin: new google.maps.Point(0,0),
		// The anchor for this image is at 17.5,41. (middle bottom)
		anchor: new google.maps.Point(17.5, 41)
	};
	var shape = {			// The clickable region of the markerIcon, defined by x,y coordinates
      	coords: [10, 1, 25, 1, 34, 12, 34, 24, 19, 40, 15, 40, 1, 24, 1, 11, 10, 1],
      	type: 'poly'
  	};

  	/** @desc This function creates a map marker for each location, and extends the global 'bounds' variable by each marker's coordinates
	  	  * It also creates a search object from each location, and pushes to vm.searchLocations array (for autocomplete)
	  	  * @param {object} currentMapMarker - The function is called once for each map location, this parameter defines the current location
	  	  */
  	function setTheMarker(currentMapMarker) {
  		// The search item that autocomplete will use
		searchItem = {
			value: currentMapMarker.title(),	// the value to autocomplete
			data: currentMapMarker				// data to be used by autocomplete when value is selected
		};
		vm.searchLocations.push(searchItem);
		var marker;

		// Define markerIcon based on currentMapMarker category
		if (currentMapMarker.category() === "beaches") {
			markerIcon.url = "img/icons/beach.png";
		} else if (currentMapMarker.category() === "hiking") {
			markerIcon.url = "img/icons/hiking.png";
		} else if (currentMapMarker.category() === "lakes") {
			markerIcon.url = "img/icons/lake.png";
		} else if (currentMapMarker.category() === "museums") {
			markerIcon.url = "img/icons/museum.png";
		} else if (currentMapMarker.category() === "resorts") {
			markerIcon.url = "img/icons/resort.png";
		}  else if (currentMapMarker.category() === null) { // Google Places does not send a category, so use a backup generic markerIcon instead
			markerIcon.url = "img/icons/standard.png";
			markerIcon.size = new google.maps.Size(22, 40);
			markerIcon.origin = new google.maps.Point(0,0);
			markerIcon.anchor = new google.maps.Point(11,40);
			shape = {
		      	coords: [10, 40, 10, 35, 8, 29, 0, 15, 0, 7, 6, 0, 16, 0, 22, 6, 22, 16, 15, 27, 12, 36, 12, 40, 10, 40],
		      	type: 'poly'
		  	};
		} else { // If Yelp returns a category not defined, use a generic markerIcon
			markerIcon.url = "img/icons/default.png";
		}

		/* Do we have latitude and longitude coordinates?
		 * (This will run if locations results have been returned by Google Places)
		 */
		if (currentMapMarker.hasOwnProperty("latitude")) {

			// save the coordinates in the currentMapMarker as a Google.maps.LatLng object
			currentMapMarker.coordinates = new google.maps.LatLng(currentMapMarker.latitude,currentMapMarker.longitude);

			marker = new google.maps.Marker({
			    map: map,
			    animation: google.maps.Animation.DROP,
			    position: currentMapMarker.coordinates,
			    icon: markerIcon,
			    shape: shape
			});

			currentMapMarker.marker(marker);				// Save the marker data in the currentMapMarker object
			createEventListener(currentMapMarker);			// Create a click event listener
			bounds.extend(currentMapMarker.coordinates);	// Extend bounds to include currentMapMarker location

		}
		// This will run if locations resutls have been returned from Yelp and we recieved coordinates
		else if (currentMapMarker.location.hasOwnProperty("coordinate")) {

			// save the coordinates in the currentMapMarker as a Google.maps.LatLng object
			currentMapMarker.coordinates = new google.maps.LatLng(currentMapMarker.location.coordinate.latitude,currentMapMarker.location.coordinate.longitude);

			marker = new google.maps.Marker({
			    map: map,
			    animation: google.maps.Animation.DROP,
			    position: currentMapMarker.coordinates,
			    icon: markerIcon,
			    shape: shape
			});

			currentMapMarker.marker(marker);				// Save the marker data in the currentMapMarker object
			createEventListener(currentMapMarker);			// Create a click event listener
			bounds.extend(currentMapMarker.coordinates);	// Extend bounds to include currentMapMarker location
		}
		// If we don't have coordinates, search google places using the currentMapMarker's title
		else {
			var request = {
			    location: mapLocation,
			    radius: '20000',
			    query: currentMapMarker.title()
			};
			var service = new google.maps.places.PlacesService(map);
			service.textSearch(request, googleCallback);

			function googleCallback(results, status) {
				// Did the google places search work?
				if (status == google.maps.places.PlacesServiceStatus.OK) {

					// save the coordinates in the currentMapMarker as a Google.maps.LatLng object
					var locCoors = [];
					for( var key in results[0].geometry.location ) {
						if ( results[0].geometry.location.hasOwnProperty(key) ) {
						    locCoors.push(results[0].geometry.location[key]);
						}
					}
			    	currentMapMarker.coordinates = new google.maps.LatLng(locCoors[0],locCoors[1]);

			    	marker = new google.maps.Marker({
					    map: map,
					    animation: google.maps.Animation.DROP,
					    position: currentMapMarker.coordinates,
					    icon: markerIcon,
			    		shape: shape
					});

					currentMapMarker.marker(marker);				// Save the marker data in the currentMapMarker object
					createEventListener(currentMapMarker);			// Create a click event listener
					bounds.extend(currentMapMarker.coordinates);	// Extend bounds to include currentMapMarker location
				} else {
					// alert the user of failure
					alert("Oops!  Looks like we couldn't find any photo walking areas in this location.\nTry a different location or get our there and explore for yourself!");
				}
			} // end googleCallback
		} // end if statement
	} // end setTheMarker

  	/** This loop calls the setTheMarker() function for each location
  	  *	Using a function encloses the current location in the function's scope
  	  * So the current location will not change while we wait for callbacks to run
  	  */
	for (i = 0; i < numberOfLocations; i++) {
		currentMarker = vm.mapLocations()[i];
		setTheMarker(currentMarker);
	}

	fitMapToBounds();

	/** Define jquery.autocomplete.js options
	  * See https://github.com/devbridge/jQuery-Autocomplete for documentation
	  */
	$('#autocomplete').autocomplete({
		lookup: vm.searchLocations,	// The array to search

		/** @desc When an autocomple suggestion is selected, open the Google infoWindow
		  * @param {object} suggestion - The object selected from vm.searchLocations
		  */
		onSelect: function (suggestion) {
			vm.openInfoWindow(suggestion.data);
		},

		/** @desc When autocomplete finds a search hint, assign the hint to vm.autocomplete observable
		  * @param {string} hint - The autocomplete hint
		  */
		onHint: function (hint) {
			vm.autocompleteHint(hint);
        },
	});
}

/** @desc zooms map based on global 'bounds' variable
  */
function fitMapToBounds() {
	map.fitBounds(bounds);
}

/** @desc Creates click event listener for Google map marker
  * @param {object} currentMarker - the location object
  */
function createEventListener(currentMarker) {
	google.maps.event.addListener(currentMarker.marker(), 'click', function() {
		vm.openInfoWindow(currentMarker);
	});
}

/** @desc The knockout.js viewModel
  */
function viewModel() {
	var self = this; // assign 'this' to a variable

	self.searchLocations = []; // array to hold variables for autocomplete.  Autocomplete does lookup in this array
	self.autocompleteHint = ko.observable(''); // The autocomplete 'hint' gets stored in this observable

	self.mapLocations = ko.observableArray([]); // observable array to hold all map locations

	self.locationSearch = ko.observable(''); // filter search term, updated by user input

	/** @desc Gets coordinates based on location name entered by user
	  */
	self.checkLocation = function() {

		self.mapLocations.removeAll();				// Clear previous location array
		self.searchLocations.length = 0;			// Clear previous autocomplete search array
		bounds = new google.maps.LatLngBounds();	// reset bounds variable

		// Geocode location
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address': self.locationSearch()}, function(results, status) {
	    	if (status == google.maps.GeocoderStatus.OK) {

	    		/** Access location coordinates by iterating over Key/Value pairs in the 'location' object returned by Google and push them to an array
				  * I do it this way because Google changed the name of the coordinate keys while in developement stages
				  * This way, if Google changes key names again, the app won't break
				  */
	    		var locCoors = [];
				for( var key in results[0].geometry.location ) {
					if ( results[0].geometry.location.hasOwnProperty(key) ) {
					    locCoors.push(results[0].geometry.location[key]);
					}
				}

	       		initialize(locCoors[0], locCoors[1]);
	      	} // end if statement
	    }); // end geocode
	}; // end checkLocation

	/** @desc This function toggles the list view open and closed
	  * It's called when the user clicks the '#show-list' element in the DOM
	  */
	self.toggleList = function() {
		$('#list-view').animate({width: 'toggle'});

		// Is the list view open?
		if ($('.relative').css('left') === '260px') {
			$('.relative').animate({left: '0'});
		} else {
			$('.relative').animate({left: '260px'});
		}
	};

	/** @desc This function opens the list view
	  */
	self.showList = function() {
		// Is the list view closed?
		if ($('#list-view').css('display') === 'none') {
			$('#list-view').animate({width: 'toggle'});
		}
		$('.relative').animate({left: '260px'});
	};

	/** @desc This function closes the list view
	  */
	self.hideList = function() {
		// Is the list view closed?
		if ($('#list-view').css('display') !== 'none') {
			$('#list-view').animate({width: 'toggle'});
		}
		$('.relative').animate({left: '0'});
	};

	/** @desc This function changes the background color of an element in the list
	  * @param {object} currentListItem - the list item that triggered the event
	  */
	self.toggleBgHover = function(currentListItem) {
		document.getElementById(currentListItem).style.backgroundColor = "#f3f3f3";
	};

	/** @desc This function changes the background color of an element in the list
	  * @param {object} currentListItem - the list item that triggered the event
	  */
	self.toggleBgLeave = function(currentListItem) {
		document.getElementById(currentListItem).style.backgroundColor = "#fff";
	};


	self.searchTerm = ko.observable(''); // updated by user input on search bar (#main-search)

	/** @desc Compares searchTerm with mapLocation titles and categories
	  * Hides or shows locations based on searchTerm
	  */
	self.updateLocations = function() {
		// Has the infoWindow already been defined?
		if (self.infoWindow() !== '') {
			// Close current infoWindow
			self.infoWindow().close();
		}

		// Run this function for each mapLocation
		self.mapLocations().forEach(function(entry) {
			// Does the mapLocation title or category contain the searchTerm, or is the search term empty?
			if (entry.title().toLowerCase().indexOf(self.searchTerm().toLowerCase()) >= 0 ||
			entry.category().indexOf(self.searchTerm().toLowerCase()) >= 0 ||
			self.searchTerm() === '') {
				entry._destroy(false); 				// show the list item
				entry.marker().setVisible(true); 	// show the map marker
			} else {
				entry._destroy(true); 				// hide the list item
				entry.marker().setVisible(false); 	// hide the map marker
			} // end if statement
		}); // end forEach function
	}; // end updateLocations

	// variables to be re-defined each time an infoWindow is opened
	var lat,						// latitude to be used by instagram API
		lng,						// longitude to be used by instagram API
		formattedInstaURL,			// instagram ajax request URL
		instagramPhotoArray,		// array to hold instagram photo objects
		numberOfInstagramPhotos;	// the number of photos returned by instagram API

	var instaID = '65450f0c27544afaa1a64a11b40d0611';	// My instagram API account ID
	self.currentMapMarker = ko.observable();			// variable to hold the map location object of the current infoWindow
	self.infoWindow = ko.observable('');				// variable to store the current infoWindow

	/** @desc This function opens a Google infoWindow and sends a request for Instagram photos
	  * @param {object} mapMarker - the map location for which to open the infoWindow and request Instagram photos
	  */
	self.openInfoWindow = function(mapMarker) {

		self.hideList(); // close the list view

		self.currentMapMarker(mapMarker);
		// Has the infoWindow variable already been set?
		if (self.infoWindow() !== '') {
			self.infoWindow().close(); // close the infoWindow
		}
		// Does the current map marker have a star count?
		if (typeof self.currentMapMarker().stars() !== "undefined") {
			self.currentMapMarker().showStars(true);		// Show the stars
		}
		// Does the current map marker have a review?
		if (typeof self.currentMapMarker().review() !== "undefined") {
			self.currentMapMarker().showReview(true);	// Show the review
		}

		// Store the google maps infoWindow to the self.infoWindow observable
		self.infoWindow(
			new google.maps.InfoWindow({
				content: $('#info-window-template').html(),
				maxWidth: 800,
				disableAutoPan: true
			})
		);

		self.infoWindow().open(map, self.currentMapMarker().marker());					// open the infoWindow
		self.currentMapMarker().marker().setAnimation(google.maps.Animation.BOUNCE);	// bounce the map marker
		setTimeout(function() {															// set a timeout for the map marker to stop bouncing after 2.1 seconds
			self.currentMapMarker().marker().setAnimation(google.maps.Animation.null);
		}, 2100);


		// Get address based currentMapMarker coordinates
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'location': self.currentMapMarker().coordinates}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
	        self.currentMapMarker().address(results[0].formatted_address); // store address in currentMapMarker's address property
	      } else {
	        self.currentMapMarker().address("unknown address");
	      }
	    });

		// define latitude and longitude based on currentMapMarkers position
	    lat = self.currentMapMarker().marker().position.G;
	    lng = self.currentMapMarker().marker().position.K;

	    // url for the Instagram AJAX request
	    formattedInstaURL = 'https://api.instagram.com/v1/media/search?lat=' + lat + '&lng=' + lng + '&distance=500&client_id=' + instaID;

	    // Timeout incase of error on Instagram AJAX request
	    var instagramTimeout = setTimeout(function(){
	        $(".instagram_error").css("display","inline"); // set '.instagram_error' element to visible
	    }, 8000);

	    /** @desc The instagram AJAX request
	      * On success, it calls a function to display the photos and clears the error timeout
	      */
	    $.ajax({
			type: "GET",
			dataType: "jsonp",
			url: formattedInstaURL,
			success: function(data) {
				self.displayInstaPhotos(data.data);
				clearTimeout(instagramTimeout);
			}
		}); // end ajax
	}; // end openInfoWindow

	/** @desc This function displays photos returned by the Instagram AJAX request
	  * It also prepares photos to be used by photoswipe
	  * @param {object} photos - data returned by Instagram API
	  */
	self.displayInstaPhotos = function(photos) {
		photoSwipeItems.length = 0;					// clear photoswipe array
		self.currentMapMarker().photos([]);			// clear currentMapMarker photos array

		photos.sort(function(a, b) {				// Sort photos by likes, from high to low
			return b.likes.count - a.likes.count;
		});

		instagramPhotoArray = photos.slice(0,8);	// Slice the first 8 photos from the Instagram object and store them in instagramPhotoArray

		// Do the photos exist?
		if (instagramPhotoArray.length === 0) {
			$(".instagram_error").css("display","inline"); // set '.instagram_error' element to visible
		}

		numberOfInstagramPhotos = instagramPhotoArray.length;
		for (i = 0; i < numberOfInstagramPhotos; i++) {
			self.currentMapMarker().photos.push(instagramPhotoArray[i]);		// push photo object to currentMapMarker's photos property
			photoSwipeItems.push( new galleryPhoto(instagramPhotoArray[i]) );	// push photo object to photoswipe array
		}

		self.infoWindow().setContent($('#info-window-template').html()); 		// now that we have photos, update the infoWindow html content

		/** This code centers the user's screen on the current infoWindow
		  * It does it dynamically depending on the user's screen width
		  */
		var infoWindowHeight = $('#info-window-template').height();		// Get the height of the current infoWindow
		var screenWidth = window.innerWidth;							// Get the width of the user's screen
		var offsetHeight;

		// Is the user's screen less than 400px wide?
		if (screenWidth <= 400) {
			offsetHeight = 140; 									// set offsetHeight to 140px
		}
		// Is the user's screen between 400px and 650px wide?
		else if (screenWidth > 400 && screenWidth < 650) {
			offsetHeight = 220;										// set offsetHeight to 220px
		}
		// Is the user's screen wider than 650px?
		else {
			offsetHeight = 280;										// set offsetHeight to 280px
		}

		// Call function to center map on infoWindow with height offset
		map.setCenterWithOffset(self.currentMapMarker().coordinates, 0, (infoWindowHeight - offsetHeight) * -1);
	};

	/** @desc This function opens the photoswipe viewing gallery
	  * It is called when the user clicks on an instagram photo thumbnail
	  * @param {string} data - the html of the Instagram thumbnail image that was clicked
	  */
	self.openGallery = function(data) {

		// define photoswipe options
		psOptions = {
		    index: parseInt($(data).attr('id')), 	// which photo to open?  Gets photo number from the ID of the photo that was clicked
		    bgOpacity: '.7', 							// sets photoswipe background to 70% opacity
		    shareEl: false,							// removes share link

		    /** @desc This function calculates the boundaries of the thumbnail image for zoom-in/out animation
		      * @param {number} index - the index of the photoswipe image
		      * @returns {object}
 		      */
		    getThumbBoundsFn: function(index) {
			    // find thumbnail element
			    var thumbnail = document.querySelectorAll('.gallery-thumb')[index];

			    // get window scroll Y
			    var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;

			    // get position of element relative to viewport
			    var rect = thumbnail.getBoundingClientRect();

			    // w = width
			    return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
			},

			/** @desc Builds photoswipe caption markup
			  * @param {object} item - The photoswipe slide object
			  * @param {object} captionEl - the caption DOM element
			  * @param {boolean} isFake - true when content is added to fake caption container (used to get size of next or previous caption)
			  */
			addCaptionHTMLFn: function(item, captionEl, isFake) {
			    if(!item.title) {
			        captionEl.children[0].innerHTML = '';
			        return false;
			    }
			    captionEl.children[0].innerHTML = item.title + '<br><small>Photographer: <a href="http://instagram.com/' + item.username + '" target="_blank" class="caption-link">' + item.username + '</a></small>';
			    return true;
			}
		}; // end options

		// Initializes and opens PhotoSwipe
		var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, photoSwipeItems, psOptions);
		gallery.init();
	}; // end openGallery
} // end viewModel

window.vm = new viewModel();	// Assign viewModel to a global variable
ko.applyBindings(vm);			// Apply knockout bindings