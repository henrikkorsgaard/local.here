/*global console, process, require, __filename, module*/

module.exports = function ( filePath ) {
    'use strict';

    //Libs
    let fs = require( 'fs' );
    let spawn = require( 'child_process' ).spawn;
    let path = require('path');
    let rootDir = path.dirname(require.main.filename);

    //Private stuff
    let configFile = filePath || rootDir + '/webstrate-pi.conf';
    let config;
    let phantom_process;

    let eventHandlers = {'ready':[], 'error':[],'terminated':[]};

    function broadcastEvent( event ) {
        let i, len = eventHandlers[event.type].length;
        for ( i = 0; i < len; i += 1 ) {
            eventHandlers[event.type][i]( event );
        }
    }

    //SETUP
    fs.readFile( configFile, 'utf8', function ( err, data ) {
        try {
            if ( err ) {
                throw err;
            }
            config = JSON.parse( data );
            broadcastEvent( {
                type: 'ready',
                msg: "Done reading config file and ready.",
                origin: __filename + " line:32"
            } );
        } catch ( err ) {
            broadcastEvent( {
                type: 'error',
                msg: "Unable to read configuration file <" + configFile + "> Error: " + err,
                origin: __filename + " line:34"
            } );
        }
    } );

    //PUBLIC
    let name = 'phantomjs';

    function start() {
        phantom_process = spawn( 'phantomjs', [ rootDir + '/scripts/phantom-pi-ws.js', JSON.stringify( config ) ] );

        phantom_process.stdout.on( 'data', function ( data ) {
            let msg = data.toString();
            console.log(msg);
        } );

        phantom_process.stderr.on( 'data', function ( data ) {
            let err = data.toString();
            broadcastEvent( {
                type: 'error',
                msg: "Error on Phantomjs stderr: " + err,
                origin: __filename + " line:50"
            } );
        } );

        phantom_process.on( 'error', function ( err ) {
            broadcastEvent( {
                type: 'error',
                msg: "Child process error in " + __filename + " Error: " + err.toString(),
                origin: __filename + " line:55"
            } );
        } );

        phantom_process.on( 'close', function ( code ) {
          broadcastEvent( {
              type: 'error',
              msg: "Child process stopped with code: "+code,
              origin: __filename + " line:76"
          } );
          stop();
        } );

    }

    function stop() {
      phantom_process.kill();
      phantom_process = undefined;
      broadcastEvent( {
          type: 'terminated',
          msg: "Phantom stopped.",
          origin: __filename + " line:84"
      } );
    }

    function on(event, callback){
        eventHandlers[event].push(callback);
    }

    return Object.freeze( {
        name,
        start,
        stop,
        on
    } );
};
