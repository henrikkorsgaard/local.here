/*global console, process, require, __filename, module*/
'use strict';

//Global logger - should be registrered somewhere else
let Logger = require( '../../lib/logger.js' );
GLOBAL.LOGGER = new Logger();

//Database models
let mongo = require( 'mongoose' );
let api = require( './api.js' );
let http = require( 'http' );


module.exports = ( function () {
    let port;
    let ip;
    let server;
    let ipRegExp = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );

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
            let match = false;
            for ( var obj in api.internalAPI ) {
                let re = new RegExp( obj );
                if ( q.url.match( re ) ) {
                    api.internalAPI[ obj ].fn( q, r );
                    match = true;
                    break;
                }
            }
            if ( !match ) {
                api.apiRequestReturn( r, {
                    status: 'error',
                    response: "Unknown API request."
                } );
            }

        } else if ( requestIp.match( ipRegExp ) && requestIp === ip ) {
            let match = false;
            for ( var obj in api.webstrateAPI ) {
                let re = new RegExp( obj );
                if ( q.url.match( re ) ) {
                    api.webstrateAPI[ obj ].fn( q, r );
                    match = true;
                    break;
                }
            }

            if ( !match ) {
                api.apiRequestReturn( r, {
                    status: 'error',
                    response: "Unknown API request."
                } );
            }
        } else if ( requestIp.match( ipRegExp ) ) {
            let match = false;
            for ( var obj in api.externalAPI ) {
                let re = new RegExp( obj );
                if ( q.url.match( re ) ) {
                    api.externalAPI[ obj ].fn( q, r );
                    match = true;
                    break;
                }
            }
            if ( !match ) {
                api.apiRequestReturn( r, {
                    status: 'error',
                    response: "Unknown API request."
                } );
            }
        } else {
            api.apiRequestReturn( r, {
                status: 'error',
                response: "Unable to identify origin and/or origin IP."
            } );
        }
    }

    return ApiServer;
}() );
