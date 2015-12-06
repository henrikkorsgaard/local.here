/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    let WebSocketServer = require( 'ws' ).Server;
    let api = require( './api.js' );
    let logger = require( './logger.js' );
    let device = require( './models/device.js' );
    let token = require( './models/token.js' );

    module.exports = server();

    function server() {
        let ws;

        function listen( config ) {
            ws = new WebSocketServer( {
                host: config.ip,
                port: config.port
            } );

            ws.on( 'connection', function ( con ) {

                let origin = con.upgradeReq.headers.origin; //we want origin to be either file:// or the particular webstrate server!
                let ip = con.upgradeReq.headers[ 'x-forwarded-for' ] || con.upgradeReq.connection.remoteAddress; //we need the ip to match stuff on the network
                let user_agent = con.upgradeReq.headers[ 'user-agent' ]; //because we can! Interesting to compare with the ip/mac scans.
                let piConnecting = ( ip === config.ip );
                console.log( "Incomming connection from " + ip );

                if ( !origin || !ip && origin !== config.webstrate_server ) { //should expand to include the valid origins and filter IPv4
                    con.close( 1003, "Unable to obtain valid connection information or illigal origin." );
                }

                con.on( 'message', function ( msg ) {
                    console.log( "Incomming message from " + ip + ": " + data );
                    let data;
                    try {
                        data = JSON.parse( msg );
                    } catch ( e ) {
                        sendMessage( {
                            "Error": "Unable to parse request. The service only accept a valid stringified JSON object."
                        } );
                    }

                    if ( piConnecting && data && data.hasOwnProperty( 'request' ) && data.hasOwnProperty( 'signature' ) ) {
                        console.log( "Connection from PI" );
                        //data should be {request: aes encryptedMessage, userID: userID}
                        //get publicKey from user and the decrypt using node crypto - see: https://gist.github.com/adrianbravo/1233693
                        //act on the command.
                        //I really do not know eha
                    } else if ( data && data.hasOwnProperty( 'request' ) && api[ data.request ] ) {
                        device.isDeviceOnLocalAreaNetwork( ip, user_agent, function ( bool ) {
                            if ( bool ) {
                                api[ data.request ]( ip, sendMessage );
                            } else {
                                sendMessage( {
                                    "Error": "Invalid request. You need to on the network for this to work (try reconnecting to " + config.ssid + ")"
                                } );
                            }

                        } );
                    } else {
                        sendMessage( {
                            "Error": "Invalid request. Essential information might be missing!"
                        } );
                    }
                } );

                con.on( 'error', function ( err ) {
                    logger.log( err, "REPORT", __filename );
                } );

                /*
                 * Fires when websocket connection is closed by client (ws.close()).
                 * Fires when websocket connection OR socket is closed on the server (con.close() || ws.close()).
                 * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for close event codes.
                 */
                con.on( 'close', function ( code ) {
                    if ( code !== 1000 && code !== 1001 && code !== 1003 && code !== 1007 ) {
                        logger.log( err, "CRITICAL", __filename );
                    }
                } );

                function sendMessage( message ) {
                    if ( con.readyState === 1 ) {
                        con.send( JSON.stringify( message ) );
                    } else {
                        console.error( 'Websocket connection is unexpectetly closed!?' );
                        console.error( 'Websocket readystate: ' + con.readyState );
                    }
                }

            } );

            /*
             * Fires on basic server connection (ip/port/etc.) errors.
             * e.g. ENOTFOUND, EADDRINUSE, EACCES
             * FATAL
             */

            ws.on( 'error', function ( err ) {
                logger.log( err, "FATAL", __filename );
            } );


        }

        function stop() {
            ws.close();
            ws = undefined;
        }

        function restart( config ) {
            stop();
            setTimeout( function () {
                listen( config );
            }, 5000 );
        }

        return Object.freeze( {
            listen,
            stop,
            restart
        } );
    }
}() );
