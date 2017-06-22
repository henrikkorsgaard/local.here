/*global console, process, require*/
( function () {
	'use strict';
	
	process.title = 'proximagic-api-server';
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
		//askAccessPoint();
		Device.clean();
		Location.clean();
	}, 4000)
	
	
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
