/*global console, process, require*/
( function () {
    'use strict';
	
	process.title = 'webstrate-pi';

	let exec = require( 'child_process' ).exec;
	let fs = require( 'fs' );
	var path = require('path');
	let request = require( 'request' );

	let macRegExp = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );
	let ipRegExp = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
	
	let config = {};
	let configFile = '/boot/webstrate-pi.config';
	let dir = path.dirname(require.main.filename);
	
	let ApiServer = require('./modules/apiServer/apiServer.js');
	let DeviceScanner = require('./modules/deviceScanner/deviceScanner.js');
	let WebstrateAgent = require('./modules/webstrateAgent/webstrateAgent.js');
	let server, scanner, webstrate;

	getUserConfig();

	function getUserConfig(){
		if(!fs.statSync(configFile).isFile()){
			configFile = dir+'/config/webstrate-pi.config';
		}
	
	    fs.readFile( configFile, 'utf8', function ( err, data ) {
	        try {
	            if ( err ) {
	                throw err;
	            }
				let lines = data.split('\n');
				for(var i = 0;i<lines.length;i++){
					if(lines[i] !== '' && lines[i].charAt(0) !== '#' ){
						let kv = lines[i].split('=');
						config[kv[0]] = kv[1];
					}
				}
				if(config.hasOwnProperty('server') && config.hasOwnProperty('login') && config.hasOwnProperty('password') && config.hasOwnProperty('webstrate') && config.hasOwnProperty('port') && config.hasOwnProperty('ssid') && config.hasOwnProperty('wifi_password')){
					getDeviceInfo();
				} else {
		            console.error("Unable to obtain configuration information");
		            process.exit( 1 );
				}
	        } catch ( e ) {
	            console.error( err );
	            process.exit( 1 );
	        }
	        if ( config ) {
		
	        }
	    } );
	}

	function getDeviceInfo(){
		exec('ifconfig wlan0', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			let ip = stdout.match(ipRegExp);
			let mac = stdout.match(macRegExp);
			try {
				config.ip = ip[0];
				config.mac = mac[0];
			} catch (e){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
		});

		exec('arp -a', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			let lines = stdout.split('\n');
			for(var i = 0;i<lines.length;i++){
				if(lines[i].indexOf("HERE") > -1){ //way better to actually scan for stationName or somethng
					try {
						config.stationIP = lines[i].match(ipRegExp)[0];
					} catch (e){
						console.error("Unable to obtain configuration information");
						process.exit(1);
					}
					break;
				}
			}
		});

		exec('iw dev wlan0 link', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			try {
				config.stationMAC = stdout.match(macRegExp)[0];
				finishedExec();
			} catch (e){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
		});

		exec('cat /proc/version', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			try {
				config.os = stdout.split('#')[0];
				finishedExec();
			} catch (e){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
		});

		exec('cat /proc/cpuinfo | grep model | grep -o ":.*" | cut -f2- -d\':\'', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			try {
				config.cpu = stdout.split('#')[0];
				finishedExec();
			} catch (e){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
		});

		exec('lsusb', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			config.peripherals = stdout.split('\n');
			finishedExec();
		});
	}

	function finishedExec(){
		if(config.hasOwnProperty('ip') && config.hasOwnProperty('mac') && config.hasOwnProperty('stationIP') && config.hasOwnProperty('stationMAC') && config.hasOwnProperty('os') && config.hasOwnProperty('cpu') && config.hasOwnProperty('peripherals') ){
			startServices();
		}
	}

	function startServices(){
		server = new ApiServer( config );
		scanner = new DeviceScanner(config);
		webstrate = new WebstrateAgent(config);
		
		setTimeout(function(){
			let pi = {};
			pi.name = config.webstrate;
			pi.mac = config.mac;
			pi.ip = config.ip;
			pi.stationMAC = config.stationMAC;
			pi.stationIP = config.stationIP;
			pi.ssid = config.ssid;
			pi.os = config.os;
			pi.cpu = config.cpu;
			pi.peripherals = config.peripherals;
			
	        var options = {
	            url: 'http://localhost:1337/pi',
	            body: pi,
	            json: true,
	            method: 'put'
	        };
	        request( options, function ( err, res, body ) {
	            if(err || (res.statusCode !== 200 && body.status !== 'ok')){
					console.log("Unable to put PI data");
	            }
	        } );		
		}, 5000);
	}
}() );
