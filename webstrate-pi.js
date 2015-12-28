/*global console, process, require*/
( function () {
    'use strict';
	//let ApiServer = require('./modules/apiServer/apiServer.js');
	//let DeviceScanner = require('./modules/deviceScanner/deviceScanner.js');

    let fs = require( 'fs' );
    let spawn = require( 'child_process' ).spawn;

    let config;
    let server, scanner, phantomjs;

    fs.readFile( 'webstrate-pi-generated.config', 'utf8', function ( err, data ) {
        try {
            if ( err ) {
                throw err;
            }
            config = JSON.parse( data );
        } catch ( e ) {
            console.error( err );
            process.exit( 1 );
        }
        if ( config ) {
			console.log(config);
			//server = new ApiServer( config );
			//scanner = new DeviceScanner(config);
			
        }
    } );

}() );
