'use strict';

let Device = require( './models/device.js' );
let Log = require( './models/log.js' );
let Pi = require( './models/pi.js' );
let Token = require( './models/token.js' );

//Crypto for AES crypto
let crypto = require( 'crypto' );
let algorithm = 'aes-256-ctr';

module.exports.internalAPI = {
    "^\/devices$": {
        description: "PUT",
        fn: function ( q, r ) {
            if ( q.method === "PUT" ) {
                let body = '';
                q.on( 'data', function ( chunk ) {
                    body += chunk.toString();
                } );
                q.on( 'end', function () {
                    Device.upsert( body, function () {
                        respondOK(r);
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^(\/devices\/)((?:(\\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}$": {
        description: "Get device based on mac address",
        fn: function ( q, r ) {
            if ( q.method === "DELETE" ) {
                let fragments = q.url.split( '/' ).filter( Boolean );
                Device.remove( fragments[ 2 ], function () {
                    respondOK(r);
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^\/logs$": {
        description: "Get service logs",
        fn: function ( q, r ) {
            if ( q.method === "PUT" ) {
                let body = '';
                q.on( 'data', function ( chunk ) {
                    body += chunk.toString();
                } );
                q.on( 'end', function () {
                    Log.insert( body, function () {
                        respondOK(r);
                    } );
                } );
            } else if ( q.method === "DELETE" ) {
                Log.remove( function () {
                    respondOK(r);
                } );
            } else {
                unsupportedMethod( r, q.method );
            }
        }
    },
    "^\/pi$": {
        description: "Get information on PI",
        fn: function ( q, r ) {
            if ( q.method === "PUT" ) {
                let body = '';
                q.on( 'data', function ( chunk ) {
                    body += chunk.toString();
                } );
                q.on( 'end', function () {
                    Pi.upsert( body, function () {
                        respondOK(r);
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    }
}

module.exports.webstrateAPI = {
    "^\/\\w{32}$": {
        description: "Validate existing token",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                let fragments = q.url.split( '/' ).filter( Boolean );
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        apiRequestReturn( r, {
                            status: 'ok',
                            token: tokenObj.token,
                            timeleft: tokenObj.timeleft
                        } );
                    } else {
                        apiRequestReturn( r, {
                            status: 'error',
                            response: "Token invalid and/or expired."
                        } );
                    }
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^\/\\w{32}\/": {
        description: "Get information on PI",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                let fragments = q.url.split( '/' ).filter( Boolean );
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        let jsonRequest;
                        try {
                            jsonRequest = JSON.parse( decrypt( fragments[ 1 ], tokenObj.publicKey ) );
                        } catch ( e ) {
                            apiRequestReturn( r, {
                                status: 'error',
                                response: "Unable to decipher request."
                            } );
                        }

                        if ( jsonRequest && jsonRequest.hasOwnProperty( 'api' ) ) {

                            if ( jsonRequest.api === 'devices' ) {
                                Device.getAll( function ( devices ) {
                                    apiRequestReturn( r, {
                                        status: 'ok',
                                        encryptedResponse: encrypt( JSON.stringify( {
                                            devices: devices
                                        } ), tokenObj.publicKey )
                                    } );
                                } );
                            } else if ( jsonRequest.api === 'pi' ) {
                                Pi.getPI( function ( pi ) {
                                    apiRequestReturn( r, {
                                        status: 'ok',
                                        encryptedResponse: encrypt( JSON.stringify( {
                                            pi: pi
                                        } ), tokenObj.publicKey )
                                    } );
                                } );
                            }
                        } else {
                            apiRequestReturn( r, {
                                status: 'error',
                                response: "Unknown API request."
                            } );
                        }
                    } else {
                        apiRequestReturn( r, {
                            status: 'error',
                            response: "Token invalid and/or expired."
                        } );
                    }
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    }
}

module.exports.externalAPI = {
    "^\/devices$": {
        description: "Get all the devices within proxomity of PI",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                Device.getAll( function ( devices ) {
                    apiRequestReturn( r, {
                        status: 'ok',
                        devices: devices
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "(^\/devices\/)(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\.\\d{1,3})$": {
        description: "Get device based on ip address",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                let fragments = q.url.split( '/' ).filter( Boolean );
                Device.getWithIP( fragments[ 1 ], function ( device ) {
                    apiRequestReturn( r, {
                        status: 'ok',
                        device: device
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "(^\/devices\/)((?:(\\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}$": {
        description: "Get device based on mac address",
        fn: function ( q, r ) {

            if ( q.method === "GET" ) {
                let fragments = q.url.split( '/' ).filter( Boolean );
                Device.getWithMac( fragments[ 1 ], function ( device ) {
                    apiRequestReturn( r, {
                        status: 'ok',
                        device: device
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^\/devices\/history$": {
        description: "Get scan history of on this PI",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                Device.getHistory( function ( history ) {
                    apiRequestReturn( r, {
                        status: 'ok',
                        devicesHistory: history
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^\/token$": {
        description: "Get a token that allow off-site requests via webstrate",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                Device.getWithIP( q.connection.remoteAddress, function ( device ) {
                    if ( device ) {
                        Token.generate( device, function ( tokenObj ) {
                            apiRequestReturn( r, {
                                status: 'ok',
                                token: tokenObj.token,
                                publicKey: tokenObj.publicKey
                            } );
                        } );
                    } else {
                        apiRequestReturn( r, {
                            status: 'error',
                            response: "Unable to identify and/or origin."
                        } );
                    }
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^\/\\w{32}$": {
        description: "Validate existing token",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                let fragments = q.url.split( '/' ).filter( Boolean );
                Token.validate( fragments[ 0 ], function ( tokenObj ) {
                    if ( tokenObj.token === 'valid' ) {
                        apiRequestReturn( r, {
                            status: 'ok',
                            token: tokenObj.token,
                            timeleft: tokenObj.timeleft
                        } );
                    } else {
                        apiRequestReturn( r, {
                            status: 'error',
                            response: "Token invalid and/or expired."
                        } );
                    }

                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    },
    "^\/logs$": {
        description: "Get service logs",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                Log.getAll( function ( logs ) {
                    apiRequestReturn( r, {
                        status: 'ok',
                        logs: logs
                    } );
                } );
            } else {
                unsupportedMethod( q.method );
            }
        }
    },
    "^\/pi$": {
        description: "Get information on PI",
        fn: function ( q, r ) {
            if ( q.method === "GET" ) {
                Pi.getPI( function ( pi ) {
                    apiRequestReturn( r, {
                        status: 'ok',
                        pi: pi
                    } );
                } );
            } else {
                unsupportedMethod(r, q.method );
            }
        }
    }
};

module.exports.apiRequestReturn = apiRequestReturn;

function unsupportedMethod(r, method ) {
    apiRequestReturn( r, {
        status: 'error',
        response: "Unsupported method " + q.method + " on this type of request."
    } );
}

function respondOK(r){
    apiRequestReturn( r, {
        status: 'ok',
    } );
}

function apiRequestReturn( response, message ) {
    if ( message.status !== 'ok' ) {
        response.writeHead( 418, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        } );
    } else {
        response.writeHead( 200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        } );
    }

    response.write( JSON.stringify( message ) );
    response.end();
}

function encrypt( text, key ) {
    var cipher = crypto.createCipher( algorithm, key );
    var crypted = cipher.update( text, 'utf8', 'hex' );
    crypted += cipher.final( 'hex' );
    return crypted;
}

function decrypt( text, key ) {
    var decipher = crypto.createDecipher( algorithm, key );
    var dec = decipher.update( text, 'hex', 'utf8' );
    dec += decipher.final( 'utf8' );
    return dec;
}
