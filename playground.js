'use strict';

let device = require('./lib/device.js');

device,getDevice("192.168.1.123", function(d){
	console.log(d);
});






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