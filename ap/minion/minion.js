const WebSocket = require('ws');
const http = require('http');
var reconnectInterval = 25 * 1000 * 60;
var ws;
var placestrate;

http.get("http://ap.here", function(response){
	let body ="";
	response.on('data', function(chunk){
		body+= chunk.toString();
		
	});
	response.on('end', function(){
		var js = JSON.parse(body);
		placestrate = js.place;
	})

});

var connect = function(){
	ws = new WebSocket('wss://emet.cc.au.dk/minion/v1/connect/'+placestrate);
	
	ws.onopen = (msg) => {
		console.log("Minon connection open!")
		ws.send("hi");
	}
	
	ws.onmessage = (msg) => {
		
		console.log("onMessage");
		console.log(msg.data);
		ws.send("Another round");
	}
		
	ws.onclose = (msg) => {
		console.log("Minion connection closed - trying to reconnect!");
		setTimeout(connect, reconnectInterval);
	}
	
	ws.onerror = (err) => {
		console.log(err)
		console.log("socket error");
	}
}

connect();


function getDevices(callback){
	http.get("http://api.here/devices", function(response){
		let body ="";
		response.on('data', function(chunk){
			body+= chunk.toString();
		
		});
		response.on('end', function(){
			var js = JSON.parse(body);
			callback(js)
		})
	});
}

