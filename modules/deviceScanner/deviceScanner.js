/*global console, process, require, __filename, modul, GLOBAL, module*/
'use strict';
let exec = require( 'child_process' ).exec;
let spawn = require( 'child_process' ).spawn;
let request = require( 'request' );

module.exports = ( function () {

    let scannerConfig;
    let scanner;
    let devices = {};
    let filter;
	let dbTimer;
	let nmapTimer;
	let nmapInterval;
	let dbInterval;
    let macRegExp = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );
    let ipRegExp = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
    var putOptions = {
        url: 'http://localhost:1337/devices',
        json: true,
        method: 'put'
    };

    function DeviceScanner( config ) {
        if ( !( this instanceof DeviceScanner ) ) {
            return new DeviceScanner( config );
        }

        if ( config && config.hasOwnProperty( 'stationMAC' ) && config.hasOwnProperty( 'ssid' ) ) {
            scannerConfig = config;
            start();
        } else {
            GLOBAL.LOGGER.log( 'Missing configuration parameters!', 'FATAL', __filename );
        }
    }

    function start() {
        filter = 'wlan.da==' + scannerConfig.stationMAC;
		dbTimer = new Date().getTime();
		nmapTimer = new Date().getTime();
		dbInterval = 1000;
		nmapInterval = 30000;
		nmapNetwork();
        
		scanner = spawn( 'tshark', [ '-i', 'mon0', '-l', '-y', 'IEEE802_11_RADIO', '-Y', filter, '-T', 'fields', '-e', 'wlan.sa', '-e', 'radiotap.dbm_antsignal', '-e', 'wlan.sa_resolved' ] );

        scanner.stdout.on( 'data', function ( data ) {
            let dataString = data.toString().replace( "\n", "" );
            let dataArray = dataString.split( "\t" );
            if ( dataArray.length === 3 && dataArray[ 0 ] !== '' && dataArray[ 1 ] !== '' && dataArray[ 2 ] !== '' ) {
                if ( !devices[ dataArray[ 0 ] ] ) {
                    devices[ dataArray[ 0 ] ] = {};
                    devices[ dataArray[ 0 ] ].mac = dataArray[ 0 ];
                    devices[ dataArray[ 0 ] ].signal = dataArray[ 1 ];
                }
                devices[ dataArray[ 0 ] ].signal = dataArray[ 1 ];
            }

            if ( new Date().getTime() > dbTimer + dbInterval ) {
                dbTimer = new Date().getTime();
                for ( let obj in devices ) {
                   let d = {
						mac: devices[ obj ].mac,
						signal: devices[ obj ].signal,
						ip: devices[ obj ].ip,
					};
					if ( devices[ obj ].signal === undefined ) {
						delete devices[ obj ];
						//removeDevice( d );

					} else {
						updateDevice( d );
						devices[ obj ].signal = undefined;
					}
				}
            }
			
            if ( new Date().getTime() > nmapTimer + nmapInterval ) {
                nmapTimer = new Date().getTime();
				nmapNetwork();
			}
        } );

        scanner.stderr.on( 'data', function ( data ) {
            GLOBAL.LOGGER.log( data.toString(), "CRITICAL", __filename );

        } );

        scanner.on( 'error', function ( err ) {
            GLOBAL.LOGGER.log( err, "FATAL", __filename );

            stop();
        } );

        scanner.on( 'close', function ( code ) {
            GLOBAL.LOGGER.log( "DeviceScanner closed with code: " + code, "LOG", __filename );
        } );
    }

    function updateDevice( device ) {
        putOptions.body = device;
        request( putOptions, function ( err, res, body ) {
            if ( err || res.statusCode !== 200 ) {
                GLOBAL.LOGGER.log( "Unable to send device to the server. Err:  " + err, "FATAL", __filename );
            }
        } );
    }

    function removeDevice( device ) {
        request.del( 'http://localhost:1337/devices/' + device.mac, function ( err, res, body ) {
            if ( err || res.statusCode !== 200 ) {
                GLOBAL.LOGGER.log( "Unable to send device to the server. Err:  " + err, "FATAL", __filename );
            }
        } );
    }

    function nmapNetwork() {
		exec('sudo nmap -sP '+scannerConfig.stationIP+'/24', function(err, stdout, stderr){
			if(err || stderr){
				console.error("Unable to obtain configuration information");
				process.exit(1);
			}
			let lines = stdout.split('\n').filter( Boolean );
			for(var i = 0;i<lines.length;i++){
				if(lines[i].search(ipRegExp) !== -1){
					let mac = lines[i+2].match(macRegExp);
					if(mac && mac[0].match(macRegExp)){
						let device = {}
						device.mac = mac[0].toLowerCase();
					
						let bits = lines[i].split(' ').filter( Boolean );
						device.name = bits[4];
						if(device.name.indexOf('.') !== -1){
							device.name = device.name.substring(0, device.name.indexOf('.'));
						}
						

						if(bits[5]){
							device.ip =  bits[5].replace("(",'').replace(")",'');
						} else {
							device.ip = bits[4];
							delete device.name;
						}
						
						if(device.ip === scannerConfig.stationIP){
							device.name = 'Station';
						}
						if(lines[i+2].split('(').filter( Boolean )[1]){
							device.vendor = lines[i+2].split('(').filter( Boolean )[1].replace(')','');
						}
						updateDevice(device);
					}
				}
			}
			
	        request.del( 'http://localhost:1337/devices', function ( err, res, body ) {
	            if ( err || res.statusCode !== 200 ) {
	                GLOBAL.LOGGER.log( "Unable to send device to the server. Err:  " + err, "FATAL", __filename );
	            }
	        } );

		});
    }


    DeviceScanner.prototype.restart = function () {
        scanner.stdin.pause();
        scanner.kill();
        start();
    };

    DeviceScanner.prototype.stop = function () {
        scanner.stdin.pause();
        scanner.kill();
    };

    return DeviceScanner;
}() );
