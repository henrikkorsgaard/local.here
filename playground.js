'use strict'
let WebSocketServer = require('websocket').server;
let http = require('http');

let server = http.createServer(function(request, response) {
   	//http server is not really used!
});
server.listen(1337, function() { });

// create the server
let wsServer = new WebSocketServer({
    httpServer: server
});



let api = {
	"api": {"description":"Sending {request: api} will return a description of the API,", "access":["local", "token", "all"], "status":"experimental", "parameters": "none","function":function(connection, request){
		let response = [];
		
		for (let a in api){
			response.push({"API name": a, "Description": api[a].description, "Access": api[a].access, "Status": api[a].status, "Request parameters": api[a].parameters});
		}
		connection.sendUTF(JSON.stringify(response));
	}},
	"pi": {"description":"Sending {request: pi} will return information on the particular PI", "access":["local", "token"], "status":"under development", "parameters": "none","function":function(connection, request){
		
	}},
	"device":{"description":"Sending {request: device} will return information on a particular device - based on ip (or mac address as parameter.", "access":["local", "token"], "status":"under development", "parameters": "[MAC address]","function":function(connection, request){
		
	}},
	"token": {"description":"Sending {request: token} will return a token that allow some interaction with the PI from outside the current local area wifi network. Default token time is 4 hours", "access":["local"], "status":"under development", "parameters": undefined,"function":function(connection, request){
		
	}},
	"devices":{"description":"Sending {request: devices} will return a list of the devices on the same network as the PI", "access":["local"], "status":"under development", "parameters": "none", "function":function(connection, request){
		
	}},
	"command":{"description":"Sending {request: command} will evaluate a unix command in the PI shell via nodejs child_process spawn.", "access":["local", "token"], "status":"under development", "parameters": "[command]","function":function(connection, request){
	}}
}

// WebSocket server
wsServer.on('request', function(req) {
	let ipRE = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
	let connection;
	let ip = req.remoteAddress.match(ipRE)[0];

	if(req.origin === 'http://webstrates.cs.au.dk' && ip){ //THIS SHOULD BE A COMPARISON WITH config.webstrate_server
		connection = req.accept(null, req.origin);
	} else {
		req.reject(503, "Illigal origin - only accepting PI webstrate origin"); 
	}
	
    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			try {
				let apiRequest = JSON.parse(message.utf8Data);
				if(api[apiRequest.request]){
					api[apiRequest.request].function(connection, apiRequest);
				} else {
					connection.sendUTF(JSON.stringify( {"type":"error", "msg":"api request not found", "original request": apiRequest.request}));
				}
			} catch(e){
				console.log(e)
			}
        }
    });

    connection.on('close', function(connection) {
        // close user connection
    });
});