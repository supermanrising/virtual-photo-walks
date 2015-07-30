# Virtual Photo Walks

Ever wanted to go on a photo walk but just couldn't find the will to go outside?  Well now you don't have to!  With Virtual Photo Walks, you can explore anywhere in the world.

## Location of Files

* Demo website is location at [ryanvrba.com/virtualphotowalks](http://ryanvrba.com/virtualphotowalks)
* Production ready files are located in the [build](build/) folder (minified using Gulp)

## Quick Setup

To run this project locally, you will need to have apache installed on your computer.  I recommend using [XAMPP](https://www.apachefriends.org/index.html).

Once you have apache running, open index.html on your localhost.

Enter your prefered photo walk location and hit enter (For best results, use 'City, State' format).  Virtual Photo Walks will load a map including map markers for popular destinations in your desired area.

Click on the toggle menu button in the top left corner of the map to open a list view of all map locations.

Use the top search bar to filter locations.

Click on a map marker to open an infoWindow for that location including Yelp data and recent popular Instagram photos taken near that location.  Click on one of the Instagram photos to open a photo viewing Gallery.

To change locations, either refresh the page or use the search bar in the bottom right corner of the map.

## Libraries / API's / Extensions

Virtual Photo Walks uses the following API services:

* [Google Maps](https://developers.google.com/maps/?hl=en)
* [Yelp](https://www.yelp.com/developers/documentation/v2/overview)
* [Instagram](https://instagram.com/developer/?hl=en)

Virtual Photo Walks uses the following Javascript libraries / extensions:

* [Knockout.js](http://knockoutjs.com/)
* [Photoswipe](http://photoswipe.com/)
* [jQuery Autocomplete](https://github.com/devbridge/jQuery-Autocomplete)
* [Yelp PHP Oauth Library](https://github.com/Yelp/yelp-api/tree/master/v2/php)

### Directory Structure

```
.
├── build
│   ├── css
│   ├── img
│   │	└── icons
│   ├── js
│   ├── photoswipe
│   │	└── default_skin
│   └── php
│    	└── lib
├── css
├── img
│   └── icons
├── node_modules
├── photoswipe
│	└── default_skin
└──	php
	└── lib
```