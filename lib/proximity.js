/*global console, process, require, __filename, module*/
let exec = require( 'child_process' ).exec;
let spawn = require( 'child_process' ).spawn;

module.exports = ( function ( config ) {
    'use strict';

    let devices = {}
    let scan;
    let macRE = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );
    let ipRE = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );

    let eventHandlers = {
        'ready': [],
        'error': [],
        'terminated': []
    };

    function broadcastEvent( event ) {
        let i, len = eventHandlers[ event.type ].length;
        for ( i = 0; i < len; i += 1 ) {
            eventHandlers[ event.type ][ i ]( event );
        }
    }

    function updateIpAndName() {
        exec( 'ping -b -c1 ' + config.broadcast + ' 2>&1 >/dev/null;arp -a', function ( err, stdout, stderr ) {
            if ( err || stderr ) {
                broadcastEvent( {
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

    function upsertDevice( device ) {
        db.upsertDevice( device, function ( err, result ) {
            if ( err ) {
                broadcastEvent( {
                    type: 'error',
                    msg: "Unable to update the database with devices: " + err,
                    origin: __filename + " line:138"
                } );
            }
        } );
    }

    function removeDevice( device ) {
        db.removeDevice( device.ip, function ( err, result ) {
            if ( err ) {
                broadcastEvent( {
                    type: 'error',
                    msg: "Unable to update the database with devices: " + err,
                    origin: __filename + " line:138"
                } );
            }
        } );
    }

    function restart() {
        db.upsertScanner( {
            mac: config.mac,
            ip: config.ip
        }, function ( err ) {
            if ( err ) {
                broadcastEvent( {
                    type: 'error',
                    msg: "Unable to update the database with the scanner and station information: " + err,
                    origin: __filename + " line:92"
                } );
            }
        } );

        db.upsertStation( {
            mac: config.station_mac,
            ip: config.station_ip
        }, function ( err ) {
            if ( err ) {
                broadcastEvent( {
                    type: 'error',
                    msg: "Unable to update the database with the scanner and station information: " + err,
                    origin: __filename + " line:92"
                } );
            }
        } );

        start();
    }

    function start() {
        broadcastEvent( {
            type: 'ready',
            msg: "Setup done - starting scanner",
            origin: __filename + " line:80"
        } );
        let filter = 'wlan.da==' + config.station_mac;
        let timer = new Date().getTime();
        let dbInterval = 1000; //update the database!

        scan = spawn( 'tshark', [ '-i', 'mon0', '-l', '-y', 'IEEE802_11_RADIO', '-Y', filter, '-T', 'fields', '-e', 'wlan.sa', '-e', 'radiotap.dbm_antsignal', '-e', 'wlan.sa_resolved' ] );

        scan.stdout.on( 'data', function ( data ) {
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
                        removeDevice( devices[ obj ] );
                        delete devices[ obj ];
                    } else {
                        upsertDevice( devices[ obj ] );
                        devices[ obj ].signal = undefined;
                    }
                }
            }
        } );

        scan.stderr.on( 'data', function ( data ) {
            broadcastEvent( {
                type: 'error',
                msg: "Error from scan stderr: " + data,
                origin: __filename + " line:160"
            } );
        } );

        scan.on( 'error', function ( err ) {
            broadcastEvent( {
                type: 'error',
                msg: "scan process error: " + err,
                origin: __filename + " line:168"
            } );
            stop();
        } );

        scan.on( 'close', function ( code ) {
            broadcastEvent( {
                type: 'error',
                msg: "Scanner process closed with the following code: " + code,
                origin: __filename + " line:177"
            } );
            stop();
        } );
    }

    function stop() {
        scan.kill();
        scan = undefined;
        broadcastEvent( {
            type: 'terminated',
            msg: "Proximity scanner terminated",
            origin: __filename + " line:187"
        } );
    }

    function on( event, callback ) {
        eventHandlers[ event ].push( callback );
    }

    return Object.freeze( {
        stop,
        restart,
        on
    } );
}() );
