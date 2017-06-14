/*global console, process, require*/
( function () {
	'use strict';
	process.title = 'proximagic-api-server';
	var http = require( 'http' );
	var api = require( './lib/api.js' ).api;

	//TODO: get local ip
	//TODO: create api server
	//TODO: token (get/post)
	//TODO: proximitynode (get/post)
	//TODO: devices (get)
	//TODO: this (get)
	console.log(api);
	http.createServer(apiServer).listen(80, '192.168.1.2');

	function apiServer(request, response){
		console.log("I got something");
		if ( request.url === '/favicon.ico' ) {
            response.writeHead( 200, {
                'Content-Type': 'image/x-icon'
            } );
            response.end();
			return;
        }
		console.log(request.url);
		var match = false;
		for ( var obj in api ) {
			var re = new RegExp( obj );
			if ( request.url.match( re ) ) {
				console.log("this is in the API");
				api[ obj ].func( request, response );
				match = true;
				break;
			}
		}

		if ( !match ) {
			api.apiResponse( response, {
				status: 'error',
				response: 'Unknown proximagic API request'
			} );
		}
		console.log("sending some response!");
		response.writeHead(200);
    	response.end();
	}
}() );
