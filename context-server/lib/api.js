'use strict';

let Device = require( './models/device.js' );
let Location = require( './models/location.js' );

let api = {
    "^\/devices$": {
        func: (q, r) => {
            if(q.method === "GET") {
				Device.findAll((response)=>{
					api.apiResponse(r, response);
				});
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/token$": {
        func: (q, r) => {
            if(q.method === "GET") {
                console.log("TOKEN GET!");
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/this$": {
        func: (q, r) => {
            if(q.method === "GET") {
				let ip = r.connection.remoteAddress;
				
                Device.findThis(ip, (d) =>{
                	api.apiResponse(r, d);
                });

            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/locations$": {
        func: (q, r) => {
            if(q.method === "GET") {
				Location.findAll((response)=>{
					api.apiResponse(r, response);
				});
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/location\/?": {
        func: (q, r) => {
            if (q.method === "POST"){
                api.apiResponse(r, {
                    status: 'ok'
                });
				
				let data = '';
				q.on( 'data', function ( chunk ) {
					data += chunk.toString();
				} );
				
				q.on( 'end', function () {
					
					Location.upsert(JSON.parse(data));
				} );
            } else if(q.method === "GET") {
				let fragments = q.url.split( '/' ).filter( Boolean );
				Location.findByName(fragments[1], (response)=>{
					api.apiResponse(r, response);
				});
				
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
	getDevices: function(ws, msg){
		Device.findAll((response)=>{
			let data = {token: msg.token, data: response}
			ws.send(JSON.stringify(data));
		});
		
	},
	getLocations: function(ws, msg){
		Location.findAll((response)=>{
			let data = {token: msg.token, data: response}
			ws.send(JSON.stringify(data));
		});	
	},
	getDevice: function(ws, msg){
		if(msg.hasOwnProperty('mac')){
			Device.findByMac(msg.mac.toLowerCase(), (resp)=> {
				let response = {data: resp, token: msg.token}
				ws.send(JSON.stringify(response));
			});
		} else if(msg.hasOwnProperty('name')){
			Device.findByName(msg.name, (resp)=>{
				let response = {data: resp, token: msg.token}
				ws.send(JSON.stringify(response));
			});
		}
	},
	getLocation: function(ws, msg){
		if(msg.hasOwnProperty('mac')){
			Location.findByMac(msg.mac.toLowerCase(), (resp)=> {
				let response = {data: resp, token: msg.token}
				ws.send(JSON.stringify(response));
			});
		} else if(msg.hasOwnProperty('name')){
			Location.findByName(msg.name, (resp)=>{
				let response = {data: resp, token: msg.token}
				ws.send(JSON.stringify(response));
			});
		}
	},
	getThis: function(ws, msg){
		let ip = ws._socket.remoteAddress;
		ip = ip.replace(/^.*:/, '');
        Device.findThis(ip, (d) =>{
			let response = {data: d, token: msg.token}
			ws.send(JSON.stringify(response));
		});
	},
    unsupportedMethod: (q, r) => {
        api.apiResponse(r, {
            status: 'error',
            response: 'This API request does not support method '+q.method
        });
    },
    apiResponse: (r, msg) => {
        
        r.writeHead( 200, {
        	'Content-Type': 'application/json',
        	'Access-Control-Allow-Origin': '*'
        } );
       
        r.write( JSON.stringify( msg ) );
        r.end();
    }
}

module.exports.api = api;
