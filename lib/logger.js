/*global console, process, require, __filename, module*/
'use strict';
let fs = require( 'fs' );
let request = require( 'request' );

//NEED TO FIX THIS WITH FIXED GLOBAL LOGGER
const logFile = 'webstrate-pi.log';
const errorLogFile = 'webstrate-pi.error.log';

function Logger() {
    if ( !( this instanceof Logger ) ) {
        return new Logger();
    }
}

Logger.prototype.log = function ( msg, type, origin ) {
    let logMessage = timestamp() + ": " + type + ": " + msg + " from " + origin + "\n";
    let logObject = {
        type:type,
        msg: msg,
        origin: origin
    }
    if(type !== "FATAL"){
      var options = {
          url: 'http://localhost:3333/logs',
          body: logObject,
          json: true,
          method: 'put'
      };
      request( options, function ( err, res, body ) {
		  console.log("from logger: err: "+err);
          if(err || (res.statusCode !== 200 && body.status !== 'ok')){
              console.error("Unable to put log");
          }

      } );
    }

    if ( type === "LOG" ) {
        fs.appendFile( logFile, logMessage, function ( err ) {
            if ( err ) {
                console.error( "***********************************" );
                console.error( "*******   LOGGING FAILED!   *******" );
                console.error( "***********************************" );

            }
        } );
    } else if(type === "ERROR" || type === "CRITICAL"){
        fs.appendFile( errorLogFile, logMessage, function ( err ) {
            if ( err ) {
                console.error( "***********************************" );
                console.error( "****   ERROR LOGGING FAILED!   ****" );
                console.error( "***********************************" );
                process.exit( 1 );
            }


        } );
    } else if(type === "FATAL"){
        if ( type === "FATAL" ) {
            console.error( logMessage );
            process.exit( 1 );
        }
    }



};

module.exports = Logger;

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
