/*global console, process, require*/
( function () {
    //SHOULD HANDLE FATAL DB ERRORS HERE! -> try a connection, then close!
    'use strict';
    let fs = require( 'fs' );
    let spawn = require( 'child_process' ).spawn;
    let pi = require( './lib/models/pi.js' );

    let config, phantomConfig, serverConfig, scannerConfig;
    let server, scanner, phantomjs;

    fs.readFile( 'webstrate-pi-local-configuration.conf', 'utf8', function ( err, data ) {
        try {
            if ( err ) { throw err; }
            config = JSON.parse( data );
        } catch ( e ) {
            console.error( err );
            process.exit( 1 );
        }
        if ( config ) {
            updatePIInfo();

            phantomConfig = {};
            phantomConfig[ 'webstrate_server' ] = config[ 'webstrate_server' ];
            phantomConfig[ 'webstrate_login' ] = config[ 'webstrate_login' ];
            phantomConfig[ 'webstrate_password' ] = config[ 'webstrate_password' ];
            phantomConfig[ 'webstrate' ] = config[ 'webstrate' ];
            phantomConfig[ 'ip' ] = config[ 'ip' ];

            serverConfig = {};
            serverConfig[ 'ip' ] = config[ 'ip' ];
            serverConfig[ 'port' ] = 1337; //port should be an option on the config.
            serverConfig[ 'webstrate_server' ] = config[ 'webstrate_server' ];

            scannerConfig = {};
			scannerConfig['station_mac'] = config['station_mac'];
			scannerConfig['broadcast'] = config['broadcast'];
			scannerConfig['ssid'] = config['ssid'];
            
			initiateProximityScanner();
            initiatiePhantomJS();
            initiateServer();
        }
    } );


    function initiateServer() {
        server = require( './lib/server.js' );

        server.on( 'change', function ( e ) {
            console.log( e );
        } );

        server.on( 'error', function ( err ) {
            console.log( err );
        } );

        server.listen( serverConfig );

    }

    function updatePIInfo() {
        let piObj = {
            mac: config.mac,
            ip: config.ip,
            stationMac: config.station_mac,
            stationIP: config.station_ip,
            SSID: config.ssid,
            os: config.os,
            cpu: config.cpu,
            peripherals: config.peripherals
        };

        pi.upsertPI( piObj, function ( err, result ) {
            if ( err ) {
                console.error( err );
            }
            console.log( result );
        } );
    }

    function initiateProximityScanner() {
        scanner = require( './lib/proximity.js' );

        scanner.on( 'change', function ( e ) {
            console.log( e );
        } );

        scanner.on( 'error', function ( err ) {
            console.log( err );
        } );

        scanner.start( scannerConfig );
    }

    function initiatiePhantomJS() {
        phantomjs = spawn( 'phantomjs', [ '--web-security=no', '/scripts/phantom-pi-ws.js', JSON.stringify( phantomConfig ) ] );

        phantomjs.stdout.on( 'data', function ( data ) {
            let msg = data.toString();
            console.log( msg );
        } );

        phantomjs.stderr.on( 'data', function ( data ) {
            let err = data.toString();
            console.log( err );
        } );

        phantomjs.on( 'error', function ( err ) {
            console.log( err );
        } );

        phantomjs.on( 'close', function ( code ) {
            console.log( "closed with code " + code );
        } );
    }

}() );
