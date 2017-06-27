/*global console, process, require*/
( function () {
	'use strict';
	
	process.title = 'proximagic-api-server';
	global.excludedMacAddresses = ['10:bf:48:e6:30:bf', 'b8:27:eb:83:01:1d']; //THIS IS USED TO STORE AP, CONTEXT-SERVER, 
	
	const Location = require( './lib/models/location.js' );
	const Device = require( './lib/models/device.js' );
	
	const WebSocket = require('ws');
	const wss = new WebSocket.Server({ port: 8080 });
	
	
	
	wss.on('connection', (ws) => {
		Location.addWebSocketConnection(ws);
		Device.addWebSocketConnection(ws);
		
		ws.on('close', (ws)=>{
			Location.removeWebSocketConnection(ws);
			Device.removeWebSocketConnection(ws);
		});
		
		ws.on('message', (msg) =>{
			//REFACTOR AT SOME POINT!
			
			try {
				let json = JSON.parse(msg);
				switch(json.cmd) {
					case "self":
						api.getThis(ws, json);
						break;
					case "devices":
						api.getDevices(ws, json);
						break;
					case "locations":
						api.getLocations(ws, json);
						break;
					case "device":
						api.getDevice(ws, json);
						break;
					case "location":
						api.getLocation(ws, json);
						break;
					default:
						let response = {error:"unknown command", token: json.token}
						ws.send(JSON.stringify(response));
				}
			} catch(e){
				let response = {error:"unable to parse message as json", token:"1337"}
				ws.send(JSON.stringify(response));	
			}
			
		});
	});
	
	var http = require( 'http' );
	var api = require( './lib/api.js' ).api;
	var urlParser = require('url');
	
	var mongo = require( 'mongoose' );
	mongo.connect( 'mongodb://localhost/proximagic' );

	http.createServer(apiServer).listen(80, '192.168.1.2');
	
	var place = 'placed.helloworld';
	var wsServer = 'http://web:strate@webstrates-server.cs.au.dk';

	function apiServer(request, response){
		var host = request.headers.host
		
		if ( request.url === '/favicon.ico' ) {
            response.writeHead( 200, {
                'Content-Type': 'image/x-icon'
            } );
            response.end();
			return;
        }

		if(host === 'api.here'){
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
			
		} else  {
			response.writeHead(302,  {Location: wsServer + '/' + place});
			response.end();
		}
	}
	
	setInterval(()=>{
		Device.clean();
		Location.clean();
	}, 4000)
	
}() );
