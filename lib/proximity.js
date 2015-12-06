s /*global console, process, require, __filename, module*/
    ( function () {
        'use strict';
        let device = require( './models/device.js' );
        let logger = require( './logger.js' );
        let exec = require( 'child_process' ).exec;
        let spawn = require( 'child_process' ).spawn;

        module.exports = proximity();

        function proximity() {
            let scanner;
            let devices = {};
            let macRE = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );
            let ipRE = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );

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

                function updateDevice( d ) {
                    device.upsertDevice( d );
                }

                function removeDevice( d ) {
                    device.removeDevice( d );
                }

                scanner.stderr.on( 'data', function ( data ) {
                    logger.log(data.toString(), "CRITICAL", __filename );
                } );

                scanner.on( 'error', function ( err ) {
                    logger.log( err, "FATAL", __filename );
                    stop();
                } );

                scanner.on( 'close', function ( code ) {
                    logger.log( "Proximity scanner closed with code: "+code, "REPORT", __filename );
                } );



                function updateIpAndName() {
                    exec( 'ping -b -c1 ' + config.broadcast + ' 2>&1 >/dev/null;arp -a', function ( err, stdout, stderr ) {
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

            return Object.freeze( {
                start,
                stop,
                restart
            } );
        }
    }() );
