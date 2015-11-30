/*global console, process, require*/
( function () {
    'use strict';
	

let fs = require( 'fs' ),
    spawn = require( 'child_process' ).spawn;
	let configFile = ( process.argv[ 2 ] && process.argv[ 2 ].indexOf( '.conf' ) === process.argv[ 2 ].length - 5 ) ? process.argv[ 2 ] : 'webstrate-pi-local-configuration.conf';
	let config;


	fs.readFile( configFile, 'utf8', function ( err, data ) {
    	try {
        	if ( err ) { throw err; }
			config = JSON.parse( data );
			
		} catch ( err ) {
        	console.error( "Unable to read configuration file <" + configFile + "> Error: " + err );
        	process.exit( 1 );
    	}
		init();
	} );
	
	function init(){
		
		let db = require('./lib/db.js')();
		console.log(db);
		
		db.getAllDevices(function(err, result){
			console.log(err);
			console.log(result);
		});
		
		
		/*
	    let proximity = require('./lib/services/proximity.js')(config);
	    proximity.on('ready', function(e){
	        console.log(e);
	    });

	    proximity.on('error', function(e){
	        console.log(e)
	    });

	    proximity.on('terminated', function(e){
	        console.log(e)
	    });
		*/
		/*
	    let phantom = require('./lib/services/phantom.js')(config);
	    phantom.on('ready', function(e){
	    	console.log(e);
	    });

	    phantom.on('error', function(e){
	        console.log(e);
	    });

	    phantom.on('terminated', function(e){
	        console.log(e);
	    });
		*
		/*
	    let server = require('./lib/services/server.js')(config);
	    server.on('ready', function(e){
	        console.log(e);
	    });

	    server.on('error', function(e){
	        console.log(e)
	    });

	    server.on('terminated', function(e){
	        console.log(e)
	    });*/
	}

}() );
