/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    let WebSocketServer = require( 'ws' ).Server;
    let api = require('./api.js');
    let device = require('./lib/models/device.js');
    let token = require('./lib/models/token.js');

    module.exports = server();

    function server() {
        let ws;

        let eventHandlers = {
            'change': [],
            'error': []
        };

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

        function listen( port ) {
            ws = new WebSocketServer( {
                host: "127.0.0.1",
                port: port
            } );

            ws.on( 'connection', function ( con ) {
                let origin = con.upgradeReq.headers.origin; //we want origin to be either file:// or the particular webstrate server!
                let ip = con.upgradeReq.headers['x-forwarded-for'] || con.upgradeReq.connection.remoteAddress; //we need the ip to match stuff on the network
                let userAgent = con.upgradeReq.headers['user-agent']; //because we can! Interesting to compare with the ip/mac scans.
                if(!origin || !ip){ //should expand to include the valid origins and filter IPv4
                    con.close(1003, "Unable to obtain either a valid origin or a valid ip");
                }

                con.on( 'message', function ( data ) {
                    let request;
                    try {
                      request = JSON.parse(data);
                    } catch(e){
                      con.close(1007, "Unable to parse request. The service only accept a valid stringified JSON object.");
                    }

                    if(request && request.hasOwnProperty('request') && api.hasOwnProperty(request.request)){
                        device.getDevice(ip, function(err, result){

                        });
                    } else {
                        con.close(1003, "Unable to handle request. Try {request:\"api\"} for information on the API.");
                    }
                } );

                con.on( 'error', function ( err ) {
                    broadcast( {
                        type: "error",
                        err: err,
                        level: "CRITICAL",
                        origin: __filename
                    } );
                } );

                /*
                 * Fires when websocket connection is closed by client (ws.close()).
                 * Fires when websocket connection OR socket is closed on the server (con.close() || ws.close()).
                 * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for close event codes.
                 */
                con.on( 'close', function ( code ) {
                    if ( code !== 1000 && code !== 1001 && code !== 1003 && code !== 1007) {
                        broadcast( {
                            type: "error",
                            err: "error from connection close with code " + code,
                            level: "CRITICAL",
                            origin: __filename
                        } );
                    }
                } );
            } );

            /*
             * Fires on basic server connection (ip/port/etc.) errors.
             * e.g. ENOTFOUND, EADDRINUSE, EACCES
             * FATAL
             */

            ws.on( 'error', function ( err ) {
                broadcast( {
                    type: "error",
                    err: err,
                    level: "FATAL",
                    origin: __filename
                } );
            } );


        }

        function stop() {
            ws.close();
            ws = undefined;
        }

        function restart() {
            stop();
            setTimeout( function () {
                listen();
            }, 5000 );
        }

        return Object.freeze( {
            listen,
            stop,
            on,
            restart
        } );
    }
}() );
/*

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

    let server = http.createServer( function ( request, response ) { //http server is not really used!
    } );
    server.listen( 1337, function () {} );

    server.on( 'error', function ( err ) {
      broadcastEvent( {
          type: 'error',
          msg: "HTTP server error" + err,
          origin: __filename + " line:28"
      } );

    } );
    // create the server
    let wsServer = new WebSocketServer( {
        httpServer: server
    } );

    wsServer.on( 'error', function ( err ) {
      broadcastEvent( {
          type: 'error',
          msg: "Websocket server error" + err,
          origin: __filename + " line:28"
      } );

    } );

    let api = {
        "api": {
            "description": "Sending {request: api} will return a description of the API,",
            "access": [ "local", "token", "all" ],
            "status": "experimental",
            "parameters": "none",
            "function": function ( connection, request ) {
                let response = [];

                for ( let a in api ) {
                    response.push( {
                        "API name": a,
                        "Description": api[ a ].description,
                        "Access": api[ a ].access,
                        "Status": api[ a ].status,
                        "Request parameters": api[ a ].parameters
                    } );
                }
                connection.sendUTF( JSON.stringify( response ) );
            }
        },
        "pi": {
            "description": "Sending {request: pi} will return information on the particular PI",
            "access": [ "local", "token" ],
            "status": "under development",
            "parameters": "none",
            "function": function ( connection, request ) {

            }
        },
        "device": {
            "description": "Sending {request: device} will return information on a particular device - based on ip (or mac address as parameter.",
            "access": [ "local", "token" ],
            "status": "under development",
            "parameters": "[MAC address]",
            "function": function ( connection, request ) {

            }
        },
        "token": {
            "description": "Sending {request: token} will return a token that allow some interaction with the PI from outside the current local area wifi network. Default token time is 4 hours",
            "access": [ "local" ],
            "status": "under development",
            "parameters": undefined,
            "function": function ( connection, request ) {

            }
        },
        "devices": {
            "description": "Sending {request: devices} will return a list of the devices on the same network as the PI",
            "access": [ "local" ],
            "status": "under development",
            "parameters": "none",
            "function": function ( connection, request ) {

            }
        },
        "command": {
            "description": "Sending {request: command} will evaluate a unix command in the PI shell via nodejs child_process spawn.",
            "access": [ "local", "token" ],
            "status": "under development",
            "parameters": "[command]",
            "function": function ( connection, request ) {}
        }
    }

    // WebSocket server
    wsServer.on( 'request', function ( req ) {
        let ipRE = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
        let connection;
        let ip = req.remoteAddress.match( ipRE )[ 0 ];

        if ( req.origin === 'http://webstrates.cs.au.dk' && ip ) { //THIS SHOULD BE A COMPARISON WITH config.webstrate_server
            connection = req.accept( null, req.origin );
        } else {
            req.reject( 503, "Illigal origin - only accepting PI webstrate origin" );
        }

        // This is the most important callback for us, we'll handle
        // all messages from users here.
        connection.on( 'message', function ( message ) {
            if ( message.type === 'utf8' ) {
                try {
                    let apiRequest = JSON.parse( message.utf8Data );
                    if ( api[ apiRequest.request ] ) {
                        api[ apiRequest.request ].function( connection, apiRequest );
                    } else {
                        connection.sendUTF( JSON.stringify( {
                            "type": "error",
                            "msg": "api request not found",
                            "original request": apiRequest.request
                        } ) );
                    }
                } catch ( e ) {
                    console.log( e )
                }
            }
        } );

        connection.on( 'close', function ( connection ) {
            //This is not really an error!
        } );

        connection.on( 'error', function ( err ) {
          broadcastEvent( {
              type: 'error',
              msg: "Websocket connection error: " + err,
              origin: __filename + " line:153"
          } );
        } );
    } );

    function on( event, callback ) {
        eventHandlers[ event ].push( callback );
    }

    return Object.freeze( {
        stop,
        restart,
        on
    } );
};
*/
