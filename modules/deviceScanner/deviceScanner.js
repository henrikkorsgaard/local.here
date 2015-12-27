/*global console, process, require, __filename, modul, GLOBAL, module*/
'use strict';
let exec = require( 'child_process' ).exec;
let spawn = require( 'child_process' ).spawn;
let request = require( 'request' );

module.exports( function () {

    let scannerConfig;
    let scanner;
    let devices = {};
    let filter;
    let macRegExp = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );
    let ipRegExp = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
    var putOptions = {
        url: 'http://localhost:3333/devices',
        json: true,
        method: 'put'
    };
    var delOptions = {
        url: 'http://localhost:3333/devices',
        json: true,
        method: 'put'
    };

    function DeviceScanner( config ) {
        if ( !( this instanceof DeviceScanner ) ) {
            return new DeviceScanner( config );
        }

        if ( config && config.hasOwnProperty( 'stationMac' ) && config.hasOwnProperty( 'broadcastIP' ) && config.hasOwnProperty( 'ssid' ) ) {
            scannerConfig = config;
            start();
        } else {
            GLOBAL.Logger.log( 'Missing configuration parameters!', 'FATAL', __filename );
        }
    }

    function start() {
        filter = 'wlan.da==' + scannerConfig.stationMac;
        scanner = spawn( 'tshark', [ '-i', 'mon0', '-l', '-y', 'IEEE802_11_RADIO', '-Y', filter, '-T', 'fields', '-e', 'wlan.sa', '-e', 'radiotap.dbm_antsignal', '-e', 'wlan.sa_resolved' ] );

        scanner.stdout.on( 'data', function ( data ) {
            let dataString = data.toString().replace( "\n", "" );
            let dataArray = dataString.split( "\t" );
            if ( dataArray.length === 3 && dataArray[ 0 ] !== '' && dataArray[ 1 ] !== '' && dataArray[ 2 ] !== '' ) {
                if ( !devices[ dataArray[ 0 ] ] ) {
                    devices[ dataArray[ 0 ] ] = {};
                    devices[ dataArray[ 0 ] ].mac = dataArray[ 0 ];
                    devices[ dataArray[ 0 ] ].signal = dataArray[ 1 ];
                    devices[ dataArray[ 0 ] ].mac_resolved = dataArray[ 2 ];
                }
                devices[ dataArray[ 0 ] ].signal = dataArray[ 1 ];
            }

            if ( new Date().getTime() > timer + dbInterval ) {
                timer = new Date().getTime();

                for ( let obj in devices ) {
                    if ( devices[ obj ].ip === undefined ) {
                        updateIpAndName();

                    } else {
                        let d = {
                            mac: devices[ obj ].mac,
                            signal: devices[ obj ].signal,
                            mac_resolved: devices[ obj ].mac_resolved,
                            user_agent: devices[ obj ].user_agent,
                            ip: devices[ obj ].ip,
                            name: devices[ obj ].name
                        };
                        if ( devices[ obj ].signal === undefined ) {
                            delete devices[ obj ];
                            removeDevice( d );

                        } else {
                            updateDevice( d );
                            devices[ obj ].signal = undefined;
                        }
                    }
                }
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
        putOptions.body = d;
        request( putOptions, function ( err, res, body ) {
            if ( err || res.statusCode !== 200 ) {
                GLOBAL.LOGGER.log( "Unable to send device to the server. Err:  " + err, "FATAL", __filename );
            }
        } );
    }

    function removeDevice( device ) {
        request.del( 'http://localhost:3333/devices/' + device.mac, function ( err, res, body ) {
            if ( err || res.statusCode !== 200 ) {
                GLOBAL.LOGGER.log( "Unable to send device to the server. Err:  " + err, "FATAL", __filename );
            }
        } );
    }

    function updateIpAndName() {
        exec( 'ping -b -c1 ' + scannerConfig.broadcastIP + ' 2>&1 >/dev/null;arp -a', function ( err, stdout, stderr ) {
            if ( err || stderr ) {
                logger.log( err || stderr, "CRITICAL", __filename );
            } else {
                let lines = stdout.split( '\n' );
                for ( let i = 1; i < lines.length; i += 1 ) {
                    if ( lines[ i ].length > 0 && lines[ i ].indexOf( config.ssid ) === -1 ) {
                        let mac = lines[ i ].match( macRE )[ 0 ];
                        if ( devices[ mac ] !== undefined ) {
                            devices[ mac ].ip = lines[ i ].match( ipRE )[ 0 ];
                            let nameString = lines[ i ].split( ' ' )[ 0 ];
                            if ( nameString.indexOf( '.' ) > -1 ) {
                                nameString = nameString.substring( 0, nameString.indexOf( '.' ) );
                            }
                            devices[ mac ].name = nameString;
                        }
                    }
                }
            }
        } );
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
