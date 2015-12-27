/*global console, process, require, __filename, module*/
'use strict';
let spawn = require( 'child_process' ).spawn;


module.exports = ( function () {

    let logger = new Logger();
    let phantomjs;
    let phantomConfig;

    function WebstrateAgent( config ) {
        if ( !( this instanceof WebstrateAgent ) ) {
            return new WebstrateAgent( config );
        }

        if ( config && config.hasOwnProperty( 'ip' ) && config.hasOwnProperty( 'webstrate' ) && config.hasOwnProperty( 'server' ) && config.hasOwnProperty( 'login' ) && config.hasOwnProperty( 'password' ) ) {
            phantomConfig = config;
            start();
        } else {
            GLOBAL.Logger.log( 'Missing configuration parameters!', 'FATAL', __filename );
        }

    }

    WebstrateAgent.prototype.restart = function () {
        phantomjs.stdin.pause();
        phantomjs.kill();
        start();
    };

    WebstrateAgent.prototype.stop = function () {
        phantomjs.stdin.pause();
        phantomjs.kill();
    };

    function start() {
        phantomjs = spawn( 'phantomjs', [ '--web-security=no', __dirname + '/phantom_script.js', JSON.stringify( phantomConfig ) ] );

        phantomjs.stdout.on( 'data', function ( data ) {
            GLOBAL.Logger.log( 'Phantomjs stdout: ' + data, 'LOG', __filename );
        } );

        phantomjs.stderr.on( 'data', function ( data ) {
            GLOBAL.Logger.log( 'Phantomjs error: ' + data, 'CRITICAL', __filename );
        } );

        phantomjs.on( 'error', function ( err ) {
            GLOBAL.Logger.log( 'Phantomjs failed with! Error: ' + err, 'FATAL', __filename );
        } );

        phantomjs.on( 'close', function ( code ) {
            if ( code === 1 ) {
                GLOBAL.Logger.log( 'Phantomjs closed unexpectely with code: ' + code, 'FATAL', __filename );
            } else {
                GLOBAL.Logger.log( 'Phantomjs closed with code: ' + code, 'LOG', __filename );
            }
        } );
    }

    return WebstrateAgent;
}() );
