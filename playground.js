'use strict';

let device = require( './lib/models/device.js' );

let mongo = require( 'mongoose' );
mongo.connect( 'mongodb://localhost/webstrate-pi' );

let d = {
    mac: "54:26:96:de:69:73",
    signal: 10,
    mac_resolve: "applede:69:73",
    user_agent: "computer",
    ip: "192.168.1.123",
    name: "test device",
}

function something() {
    //castError if number is undefined -> where to handle that?
    device.getAllDeviceHistory(
        function ( de ) {
            console.log( de );
        } );

    setInterval( function () {
        something();
    }, 2000 );
}

something();



/*
let spawn = require('child_process').spawn;

let localSSH = spawn('ssh', ['webstrateuser@localhost']);

localSSH.stdout.on('data', function(data) {
	let msg = data.toString();
	console.log("data");
	console.log(msg);
});

localSSH.stderr.on('data', function(data) {
	let err = data.toString();
	console.log("error");
	console.log(err);
});

localSSH.on('error', function(err) {
	console.log(err);
	process.exit(1);
});

localSSH.on('close', function(code) {
	console.log("closed with code " + code);
	process.exit();
});
*/
