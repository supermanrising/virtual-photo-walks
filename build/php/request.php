<?php

/**
 * Yelp API v2.0
 *
 * This program uses the Yelp Search API to query for businesses by location
 *
 * Please refer to http://www.yelp.com/developers/documentation for the API documentation.
 *
 * This program requires a PHP OAuth2 library, which can be found here:
 *      http://oauth.googlecode.com/svn/code/php/
 */

// The path to the oauth library
require_once('lib/OAuth.php');

// OAuth credentials
// These credentials can be obtained from the 'Manage API Access' page in the
// developers documentation (http://www.yelp.com/developers)
$CONSUMER_KEY = 'LxTY48_V9wVNDG1ksQ0ZFg';
$CONSUMER_SECRET = 'ejmLvWiVfy4W3JhJ6Llf-__cwjQ';
$TOKEN = 'uSj2SuYXmtFVtHvw1Rja4-WwIl6B5L6q';
$TOKEN_SECRET = 'REhIL3SPwbUPywbn0P82-FHvrhs';


$API_HOST = 'api.yelp.com';
$DEFAULT_LOCATION = 'Vancouver, BC';
$SEARCH_LIMIT = 20;
$CATEGORY = 'beaches,hiking,lakes,resorts,museums';
$SEARCH_PATH = '/v2/search/';


/**
 * Makes a request to the Yelp API and returns the response
 *
 * @param    $host    The domain host of the API
 * @param    $path    The path of the APi after the domain
 * @return   The JSON response from the request
 */
function request($host, $path) {
    $unsigned_url = "http://" . $host . $path;

    // Token object built using the OAuth library
    $token = new OAuthToken($GLOBALS['TOKEN'], $GLOBALS['TOKEN_SECRET']);

    // Consumer object built using the OAuth library
    $consumer = new OAuthConsumer($GLOBALS['CONSUMER_KEY'], $GLOBALS['CONSUMER_SECRET']);

    // Yelp uses HMAC SHA1 encoding
    $signature_method = new OAuthSignatureMethod_HMAC_SHA1();

    $oauthrequest = OAuthRequest::from_consumer_and_token(
        $consumer,
        $token,
        'GET',
        $unsigned_url
    );

    // Sign the request
    $oauthrequest->sign_request($signature_method, $consumer, $token);

    // Get the signed URL
    $signed_url = $oauthrequest->to_url();

    // Send Yelp API Call
    $ch = curl_init($signed_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    $data = curl_exec($ch);
    curl_close($ch);

    return $data;
}

/**
 * Query the Search API by a search term and location
 *
 * @param    $location    The search location passed to the API
 * @return   The JSON response from the request
 */
function search($location) {
    $url_params = array();
    $url_params['ll'] = $location?: $GLOBALS['DEFAULT_LOCATION'];
    $url_params['limit'] = $GLOBALS['SEARCH_LIMIT'];
    $url_params['category_filter'] = $GLOBALS['CATEGORY'];

    // 0 = 'best matched'
    // 2 = 'top rated'
    $url_params['sort'] = 0;

    $search_path = $GLOBALS['SEARCH_PATH'] . "?" . http_build_query($url_params);

    echo request($GLOBALS['API_HOST'], $search_path);
}

$lat = $_GET["lat"];
$lng = $_GET["lng"];
$location = $lat . "," . $lng;

search($location);

?>