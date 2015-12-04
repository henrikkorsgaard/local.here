/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    let device = require( './models/device.js' );

    let exec = require( 'child_process' ).exec;
    let spawn = require( 'child_process' ).spawn;

    module.exports = proximity();

    function proximity() {
        let scanner;
        let devices = {};
        let macRE = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );
        let ipRE = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );

        let eventHandlers = {
            'change': [],
            'error': []
        };


        function start( config ) {

            let filter = 'wlan.da==' + config.station_mac;
            let timer = new Date().getTime();
            let dbInterval = 1000; //update the database!

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
                        console.log( devices[ obj ] );
                        if ( devices[ obj ].ip === undefined ) {
                            updateIpAndName();
                            break;
                        }

                        if ( devices[ obj ].signal === undefined ) {
                            device.removeDevice( devices[ obj ] );
                            delete devices[ obj ];
                        } else {
                            device.upsertDevice( devices[ obj ] );
                            devices[ obj ].signal = undefined;
                        }
                    }
                }
            } );

            scanner.stderr.on( 'data', function ( data ) {
                broadcast( {
                    type: 'error',
                    err: "Error from scan stderr: " + data,
                    level: "CRITICAL",
                    origin: __filename
                } );
            } );

            scanner.on( 'error', function ( err ) {
                broadcast( {
                    type: 'error',
                    err: "scan process error: " + err,
                    level: "FATAL",
                    origin: __filename
                } );
                stop();
            } );

            scanner.on( 'close', function ( code ) {
                console.log( "closing" );
                console.log( code );
                /*
                broadcast( {
                    type: 'error',
                    err: "Scanner process closed with the following code: " + code,
                    level: "CRITICAL",
                    origin: __filename
                } );
                */

            } );



            function updateIpAndName() {
                exec( 'ping -b -c1 ' + config.broadcast + ' 2>&1 >/dev/null;arp -a', function ( err, stdout, stderr ) {
                    if ( err || stderr ) {
                        broadcast( {
                            type: 'error',
                            msg: "Unable to ping and arp -a scan for devices " + stderr || err,
                            origin: __filename + " line:37"
                        } );
                    } else {
                        let lines = stdout.split( '\n' );
                        for ( let i = 1; i < lines.length; i += 1 ) {
                            if ( lines[ i ].length > 0 && lines[ i ].indexOf( config.ssid ) === -1 ) {
                                let mac = lines[ i ].match( macRE )[ 0 ];
                                if ( devices[ mac ] !== undefined ) {
                                    devices[ mac ].ip = lines[ i ].match( ipRE )[ 0 ];
                                    let nameString = lines[ i ].split( ' ' )[ 0 ];
                                    devices[ mac ].name = nameString;
                                }
                            }
                        }
                    }
                } );
            }

        }

        function stop() {
            scanner.kill();
            scanner = undefined;
        }

        function restart( config ) {
            stop();
            setTimeout( function () {
                start( config );
            }, 5000 );
        }

        function on( event, callback ) {
            if ( eventHandlers[ event ] ) {
                eventHandlers[ event ].push( callback );
            }
        }

        function broadcast( event ) {
            let i, len = eventHandlers[ event.type ].length;
            for ( i = 0; i < len; i += 1 ) {
                eventHandlers[ event.type ][ i ]( event );
            }
        }

        return Object.freeze( {
            start,
            stop,
            on,
            restart
        } );
    }
}() );
