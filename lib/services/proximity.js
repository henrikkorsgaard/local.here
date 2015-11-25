/*global console, process, require, __filename, module*/

module.exports = function () {
    'use strict';

    //Private stuff
    //LIBS
    let exec = require( 'child_process' ).exec;
    let spawn = require( 'child_process' ).spawn;
    let proxiDB = require( '../db.js' );

    let station = {},
        scanner = {},
        devices = {};
    let stationBroadcast;
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
        exec( 'ping -b -c1 ' + stationBC + ' 2>&1 >/dev/null;arp -a', function ( err, stdout, stderr ) {
            if ( err || stderr ) {
                broadcastEvent( {
                    type: 'error',
                    msg: "Unable to ping and arp -a scan for devices " + stderr || err,
                    origin: __filename + " line:37"
                } );
            } else {
                let lines = stdout.split( '\n' );

                for ( let i = 1; i < lines.length; i += 1 ) {
                    if ( lines[ i ].length > 0 && lines[ i ].indexOf( station.SSID ) === -1 ) {
                        let mac = lines[ i ].match( macRE )[ 0 ];
                        if ( devices[ mac ] !== undefined ) {
                            devices[ mac ].ip = lines[ i ].match( ipRE )[ 0 ];
                            let nameString = lines[ i ].split( ' ' )[ 0 ];
                            devices[ mac ].name = nameString.substring( 0, nameString.indexOf( '.' ) );
                        }
                    }
                }
            }
        } );
    }

    //SETUP
    exec( 'iw dev mon0 info || iw wlan0 interface add mon0 type monitor;ip link set mon0 up', function ( err, stdout, stderr ) {
        //The stderr: command failed: No such device (-19) is thrown when iw dew mon0 info fails to find the mon0 device - go through OR case
        if ( ( stderr && stderr.indexOf( 'command failed: No such device (-19)' ) === -1 ) || err ) {
            broadcastEvent( {
                type: 'error',
                msg: "Unable to set up monitoring device. Error: " + stderr || err,
                origin: __filename + " line:63"
            } );
        } else {
            exec( "iw dev wlan0 link | egrep -w 'SSID|wlan0'; ifconfig wlan0 | egrep -w 'HWaddr|inet addr'; arp -a", function ( err, stdout, stderr ) {
                if ( err || stderr ) {
                    broadcastEvent( {
                        type: 'error',
                        msg: "Unable to query scanner and station information: " + err || stderr,
                        origin: __filename + " line:71"
                    } );
                } else {
                    let lines = stdout.replace( /\t/g, '' ).split( '\n' );
                    station.mac = lines[ 0 ].match( macRE )[ 0 ];
                    station.SSID = lines[ 1 ].replace( 'SSID: ', '' );
                    scanner.mac = lines[ 2 ].match( macRE )[ 0 ]; //easierly obtained with node os module
                    scanner.ip = lines[ 3 ].match( ipRE )[ 0 ]; //easierly obtained
                    stationBroadcast = lines[ 3 ].match( ipRE )[ 1 ];

                    for ( let i = 4; i < lines.length; i += 1 ) {
                        if ( lines[ i ].indexOf( station.SSID ) > -1 ) {
                            station.ip = lines[ i ].match( ipRE )[ 0 ];
                            break;
                        }
                    }
                    proxiDB.upsertScanner( scanner.mac, scanner, station, function ( err) {
                        if ( err ) {
                            broadcastEvent( {
                                type: 'error',
                                msg: "Unable to update the database with the scanner and station information: " + err,
                                origin: __filename + " line:92"
                            } );
                        } else {
                            broadcastEvent( {
                                type: 'ready',
                                msg: "Ready to start scanning for devices in proximity!",
                                origin: __filename + " line:98"
                            } );
                        }
                    } );
                }
            } );
        }
    } );

    //Public stuff
    let name = 'proximity';

    function start() {
        let filter = 'wlan.da==' + station.mac;
        let timer = new Date().getTime();
        let dbInterval = 2000; //update the database!

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

                proxiDB.upsertDevices( scanner.mac, devices, function ( err ) {
                    if ( err ) {
                      broadcastEvent( {
                          type: 'error',
                          msg: "Unable to update the database with devices: " + err,
                          origin: __filename + " line:138"
                      } );
                    }
                } );

                for ( let obj in devices ) {
                    if ( devices[ obj ].ip === undefined ) {
                        updateIpAndName();
                        break;
                    }
                    if ( devices[ obj ].signal === undefined ) {
                        delete devices[ obj ];
                    }
                    devices[ obj ].signal = undefined;
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
        name,
        start,
        stop,
        on
    } );
};
