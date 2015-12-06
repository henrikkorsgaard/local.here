/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    let fs = require( 'fs' );
    let logFile = 'webstrate-pi.log';

    module.exports = logger();

    function timestamp() {

        let now = new Date();
        let date = [ now.getDate(), now.getMonth() + 1, now.getFullYear() ];
        let time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

        for ( var i = 1; i < 3; i++ ) {
            if ( time[ i ] < 10 ) {
                time[ i ] = "0" + time[ i ];
            }
        }
        return date.join( "/" ) + " " + time.join( ":" );
    }

    function logger() {

        function log( error, level, origin ) {
            let logMessage = timestamp() + " " + level + "ERROR: " + error + " from " + origin + "\n";

            fs.appendFile( logFile, logMessage, function ( err ) {
                if ( err ) {
                    console.error( "***********************************" );
                    console.error( "****   ERROR LOGGIN FAILED!   *****" );
                    console.error( "***********************************" );
                    process.exit( 1 );
                }

                if ( level === "FATAL" ) {
                    console.error( logMessage );
                    process.exit( 1 );
                }
            } );
        }



        return Object.freeze( {
            log,
        } );
    }
}() );
