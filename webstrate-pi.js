/*global console, process, require*/
( function () {

    'use strict';
	
	let proxiDB = require( './lib/db.js' )();
	proxiDB.getAllDevices(function(err, result){
		console.log(err);
		console.log(result);
	});
	
	//TOOD: MAKE DB INSTANCE A SINGLETON OR MAKE IT DEAL OUT POOLS!
	
	//WORKING ATM
	/*
    let phantom = require('./lib/services/phantom.js')();
    phantom.on('ready', function(e){
        phantom.start();
    });

    phantom.on('error', function(e){
        console.log(e)
    });

    phantom.on('terminated', function(e){
        console.log(e)
    });
	*/
	
	
	
	// WORKING ATM
	/*
    let proximity = require('./lib/services/proximity.js')();
    proximity.on('ready', function(e){
        console.log(e);
		proximity.start();
    });

    proximity.on('error', function(e){
        console.log(e)
    });

    proximity.on('terminated', function(e){
        console.log(e)
    });
	*/
	

    /*
    let fs = require( 'fs' ),
        spawn = require( 'child_process' ).spawn;
    let configFile = ( process.argv[ 2 ] && process.argv[ 2 ].indexOf( '.conf' ) === process.argv[ 2 ].length - 5 ) ? process.argv[ 2 ] : 'webstrate-pi.conf';
    let config;
    let phantom_process;
    let activeServices = {};

    fs.readFile( configFile, 'utf8', function ( err, data ) {
        try {
            if ( err ) {
                throw err;
            }
            config = JSON.parse( data );
            init();
        } catch ( err ) {
            console.error( "Unable to read configuration file <" + configFile + "> Error: " + err );
            process.exit( 1 );
        }
    } );


    function init() {

        //setupBrowser(); Should be done regardless
        //setupProximityScanner();
    }


    function setupProximityScanner() {
        let proximity = require( './lib/proximity.js' )();
        proximity.addEventListener( function ( e ) {
            if ( e === 'READY' ) {
                activeServices[ proximity.name ] = proximity;
            } else if ( e === 'CRASHED' || e === 'STOPPED' ) {
                console.log( e );
                delete activeServices[ proximity.name ];
            }
        } );

        proximity.init();
    }

    function setupBrowser() {
        phantom_process = spawn( 'phantomjs', [ './scripts/phantom-pi-ws.js', JSON.stringify( config ) ] );

        phantom_process.stdout.on( 'data', function ( data ) {
            let msg = data.toString();
            console.log( msg );
        } );

        phantom_process.stderr.on( 'data', function ( data ) {
            let msg = data.toString();
            console.log( msg );
        } );

        phantom_process.on( 'error', function ( err ) {
            console.error( "Process error!" );
            console.log( err );
        } );

        phantom_process.on( 'close', function ( code ) {
            console.log( "Phantom closed with the following code: " + code );
        } );
    }*/
}() );
