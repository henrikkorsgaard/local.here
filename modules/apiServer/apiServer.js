/*global console, process, require, __filename, module*/
'use strict';
let Logger = require( '../../lib/logger.js' );
GLOBAL.LOGGER = new Logger();
let Device = require( './models/device.js' );
let Log = require( './models/log.js' );
let Pi = require( './models/pi.js' );
let Token = require( './models/token.js' );
let crypto = require( 'crypto' );
let algorithm = 'aes-256-ctr';
let http = require( 'http' );
let mongo = require( 'mongoose' );

module.exports = ( function () {

    let port;
    let ip;
    let server;
    let ipRegExp = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
    let macRegExp = new RegExp( /((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/ );

    mongo.connect( 'mongodb://localhost/webstrate-pi' );

    function ApiServer( config ) {
        if ( !( this instanceof ApiServer ) ) {
            return new ApiServer( config );
        }

        if ( config && config.hasOwnProperty( 'port' ) && config.hasOwnProperty( 'ip' ) ) {
            port = config.port;
            ip = config.ip;
            server = http.createServer( apiRequest );
            server.listen( port, "0.0.0.0", function () {
                GLOBAL.LOGGER.log( "ApiServer listening on port: " + port, "LOG", __filename );
            } ); //experimental ip - accept all connections
        } else {
            GLOBAL.LOGGER.log( 'Missing configuration parameters!', 'FATAL', __filename );
        }
    }

    ApiServer.prototype.restart = function () {
        server.close();
        server.listen( port, "0.0.0.0", function () {
            GLOBAL.LOGGER.log( "ApiServer restarted on port: " + port, "LOG", __filename );
        } );
    };

    ApiServer.prototype.stop = function () {
        server.close();
    };

    function apiRequest( q, r ) {
        if ( q.url === '/favicon.ico' ) {
            r.writeHead( 200, {
                'Content-Type': 'image/x-icon'
            } );
            r.end();
        }

        let requestIp = q.connection.remoteAddress;
        let origin = q.headers.host;
        if ( requestIp.match( ipRegExp ) && requestIp === "127.0.0.1" ) {
            handleInternalRequest( q, r );
        } else if ( requestIp.match( ipRegExp ) && requestIp === ip ) {
            handlePIrequest( q, r );
        } else if ( requestIp.match( ipRegExp ) ) {
            handleExternalRequest( q, r, requestIp );
        } else {
            apiError( r, "Unknown request or origin!" );
        }
    }

    function handleInternalRequest( q, r ) {
        let method = q.method;
        let fragments = q.url.split( '/' ).filter( Boolean );
        if ( method === 'PUT' ) {
            let body = '';
            q.on( 'data', function ( chunk ) {
                body += chunk.toString();
            } );
            q.on( 'end', function () {
                if ( fragments[ 0 ] === 'devices' ) {
                    Device.upsert( body, function () {
                        apiReturn( r, {
                            status: "ok"
                        } );
                    } );
                } else if ( fragments[ 0 ] === 'logs' ) {
                    Log.insert( body, function () {
                        apiReturn( r, {
                            status: "ok"
                        } );
                    } );
                } else if ( fragments[ 0 ] === 'pi' ) {
                    Pi.upsert( body, function () {
                        apiReturn( r, {
                            status: "ok"
                        } );
                    } );
                } else {
                    apiError( r, "Not implemented yet!" );
                }
            } );
        } else if ( method === 'DELETE' ) {
            if ( fragments[ 0 ] === 'devices' && fragments.length === 2 && fragments[ 1 ].match( macRegExp ) ) {
                Device.remove( fragments[ 2 ], function () {
                    apiReturn( r, {
                        status: "ok"
                    } );
                } );
            } else if ( fragments[ 0 ] === 'logs' && fragments.length === 1 ) {
                Log.remove( function () {
                    apiReturn( r, {
                        status: "ok"
                    } );
                } );
            } else {
                apiError( r, "Unknown request or origin!" );
            }
        } else {
            apiError( r, "Unknown request or origin!" );
        }

    }

    function handlePIrequest( q, r ) {
        let method = q.method;
        let fragments = q.url.split( '/' ).filter( Boolean );
        if ( method === 'GET' ) {
            if ( fragments.length === 1 && fragments[ 0 ].length === 32 ) {
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        delete tokenObj.publicKey;
                        apiReturn( r, tokenObj );
                    } else {
                        apiError( r, "token invalid or expired!" );
                    }
                } );
            } else if ( fragments.length === 2 && fragments[ 0 ].length === 32 ) {
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        let jsonRequest;
                        try {
                            jsonRequest = JSON.parse(decrypt(fragments[ 1 ], tokenObj.publicKey));
                        } catch(e){
                            apiError( r, "unable to decipher request" );
                        }
                        if(jsonRequest && jsonRequest.hasOwnProperty('api')){

                            if(jsonRequest.api === 'devices'){
                              Device.getAll( function ( devices ) {
                                let object = {
                                    encryptedResponse: encrypt( JSON.stringify({devices:devices}),tokenObj.publicKey)
                                }
                                  apiReturn( r, object );
                              } );
                            } else if(jsonRequest.api === 'pi'){
                              Pi.getPI( function ( pi ) {
                                  let object = {
                                      encryptedResponse: encrypt( JSON.stringify({pi:pi}),tokenObj.publicKey)
                                  }
                                  apiReturn( r, object);
                              } );
                            }
                        } else {
                            apiError( r, "Unknown request" );
                        }
                    } else {
                        apiError( r, "token invalid or expired!" );
                    }
                } );
            } else {
                apiError( r, "Unknown request or origin!" );
            }
        } else {
            apiError( r, "Unknown request or origin!" );
        }
    }

    function handleExternalRequest( q, r, requestIp) {
        let method = q.method;
        let userAgent = q.headers[ 'user-agent' ];
        let fragments = q.url.split( '/' ).filter( Boolean );
        if ( method === 'GET' ) {
            if ( fragments.length === 1 && fragments[ 0 ] === 'token' ) {
                Device.getWithIP(requestIp, function(device){
                    if(device){
                      Token.generate(device, function ( tokenObj ) {
                          apiReturn( r, tokenObj );
                      } );
                    } else {
                        apiError( r, "Unable to identify device and/or origin!" );
                    }
                });

            } else if ( fragments.length === 1 && fragments[ 0 ].length === 32 ) {
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        apiReturn( r, tokenObj );
                    } else {
                        apiError( r, "token invalid or expired!" );
                    }

                } );
            } else if ( fragments.length === 1 && fragments[ 0 ] === 'pi' ) {
                Pi.getPI( function ( pi ) {
                    apiReturn( r, {
                        pi: pi
                    } );
                } );
            } else if ( fragments.length > 1 ) {
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        if ( fragments.length === 2 && fragments[ 1 ] === 'devices' ) {
                            Device.getAll( function ( devices ) {
                                apiReturn( r, {
                                    devices: devices
                                } );
                            } );
                        } else if ( fragments.length === 2 && fragments[ 1 ] === 'logs' ) {
                            Log.getAll( function ( logs ) {
                                apiReturn( r, {
                                    logs: logs
                                } );
                            } );
                        } else if ( fragments.length === 3 && fragments[ 1 ] === 'devices' && (fragments[ 2 ].match(macRegExp) || fragments[ 2 ].match(ipRegExp))) {
                            if(fragments[ 2 ].match(macRegExp)){
                                Device.getWithMac(fragments[ 2 ], function(device){
                                  apiReturn( r, {
                                      device: device
                                  } );
                                });
                            } else {
                              Device.getWithIP(fragments[ 2 ], function(device){
                                apiReturn( r, {
                                    device: device
                                } );
                              });
                            }

                        } else {
                            apiError( r, "Unknown request!" );
                        }
                    } else {
                        apiError( r, "token invalid or expired!" );
                    }
                } );

            } else {
                apiError( r, "Not implemented yet!" );
            }

        } else {
            apiError( r, "Unknown request or origin!" );
        }
    }

    function apiError( r, msg ) {
        r.writeHead( 418, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        } );
        r.write( JSON.stringify( {
            status: 'error',
            msg: msg
        } ) );
        r.end();
    }

    function apiReturn( r, object ) {
        r.writeHead( 200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        } );
        object.status = 'ok';
        r.write( JSON.stringify( object ) );
        r.end();
    }

    function encrypt( text, key ) {
        var cipher = crypto.createCipher( algorithm, key )
        var crypted = cipher.update( text, 'utf8', 'hex' )
        crypted += cipher.final( 'hex' );
        return crypted;
    }

    function decrypt( text, key ) {
        var decipher = crypto.createDecipher( algorithm, key )
        var dec = decipher.update( text, 'hex', 'utf8' )
        dec += decipher.final( 'utf8' );
        return dec;
    }

    return ApiServer;
}() );
