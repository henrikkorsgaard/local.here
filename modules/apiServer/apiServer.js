/*global console, process, require, __filename, module*/
'use strict';
let Logger = require( '../../lib/logger.js' );
GLOBAL.LOGGER = new Logger();
let Device = require( './models/device.js' );
let Log = require( './models/log.js' );
let Pi = require( './models/pi.js' );
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
            handleExternalRequest( q, r );
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
                    Device.upsert(body, function(){
                        apiReturn( r, {status: "ok"} );
                    });
                } else if(fragments[ 0 ] === 'logs'){
                    Log.insert(body,function(){
                        apiReturn( r, {status: "ok"} );
                    });
                } else if(fragments[ 0 ] === 'pi'){
                    Pi.upsert(body,function(){
                        apiReturn( r, {status: "ok"} );
                    });
                } else {
                    apiError( r, "Not implemented yet!" );
                }
            } );
        } else if ( method === 'DELETE') {
            if(fragments[0] === 'devices' && fragments.length === 2 && fragments[1].match(macRegExp)){
                Device.remove(fragments[2], function(){
                    apiReturn( r, {status: "ok"} );
                });
            } else if(fragments[0] === 'logs' && fragments.length === 1){
                Log.remove(function(){
                    apiReturn( r, {status: "ok"} );
                });
            } else {
                apiError( r, "Unknown request or origin!" );
            }
        } else {
            apiError( r, "Unknown request or origin!" );
        }

    }

    function handlePIRequest( q, r ) {
        let method = q.method;
        let fragments = q.url.split( '/' ).filter( Boolean );
        if ( method === 'GET' ) {
            apiError( r, "Not implemented yet!" );
            //GET
            //PI
            //Token/devices
            //Token/log
        } else {
            apiError( r, "Unknown request or origin!" );
        }
    }

    function handleExternalRequest( q, r ) {
        let method = q.method;
        let userAgent = q.headers[ 'user-agent' ];
        let fragments = q.url.split( '/' ).filter( Boolean );
        if ( method === 'GET' ) {
            apiError( r, "Not implemented yet!" );
            //GET
            //PI
            //Token/devices
            //Token/log
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

    return ApiServer;
}() );
