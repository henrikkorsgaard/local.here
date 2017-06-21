/*global console, process, require*/
( function () {
	'use strict';
	
	process.title = 'proximagic-api-server';
	let Location = require( './lib/models/location.js' );
	let Device = require( './lib/models/device.js' );
	var http = require( 'http' );
	var api = require( './lib/api.js' ).api;
	
	var mongo = require( 'mongoose' );
	mongo.connect( 'mongodb://localhost/proximagic' );

	http.createServer(apiServer).listen(80, '192.168.1.2');

	function apiServer(request, response){
		if ( request.url === '/favicon.ico' ) {
            response.writeHead( 200, {
                'Content-Type': 'image/x-icon'
            } );
            response.end();
			return;
        }
		
		
		var match = false;
		for ( var obj in api ) {
			var re = new RegExp( obj );
			if ( request.url.match( re ) ) {
				api[ obj ].func( request, response );
				match = true;
				break;
			}
		}

		if ( !match ) {
			api.apiResponse( response, {
				status: 'error',
				response: 'Unknown API request'
			} );
		}
	}
	

	
	setInterval(()=>{
		askAccessPoint();
		Device.clean();
		Location.clean();
	}, 5000)
	
	
	function askAccessPoint(){
		http.get("http://ap.here", (response)=>{
			let data = "";
			response.on("data", (d)=>{
				data += d;
			});
			response.on("end", (e)=>{
				try {
					let js = JSON.parse(data);
					let obj = {};
					Location.upsert(js);
				} catch(e){
					console.log("whaat")
					console.log(e);
				}
			})
			
		});
	}
}() );
