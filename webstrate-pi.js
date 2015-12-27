/*global console, process, require*/
( function () {
    'use strict';
    let mongo = require( 'mongoose' );
    mongo.connect( 'mongodb://localhost/webstrate-pi' );

    let fs = require( 'fs' );
    let spawn = require( 'child_process' ).spawn;
    let pi = require( './lib/models/pi.js' );
    let logger = require( './lib/logger.js' );

    let config, phantomConfig, serverConfig, scannerConfig;
    let server, scanner, phantomjs;

    fs.readFile( 'webstrate-pi-local-configuration.conf', 'utf8', function ( err, data ) {
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
            updatePIInfo();

            phantomConfig = {};
            phantomConfig.webstrate_server = config.webstrate_server;
            phantomConfig.webstrate_login = config.webstrate_login;
            phantomConfig.webstrate_password = config.webstrate_password;
            phantomConfig.webstrate = config.webstrate;
            phantomConfig.ip = config.ip;

            serverConfig = {};
            serverConfig.ip = config.ip;
            serverConfig.port = 1337; //port should be an option on the config.
            serverConfig.webstrate_server = config.webstrate_server;
            serverConfig.ssid = config.ssid;

            scannerConfig = {};
            scannerConfig.station_mac = config.station_mac;
            scannerConfig.broadcast = config.broadcast;
            scannerConfig.ssid = config.ssid;

            initiateProximityScanner();
            initiatiePhantomJS();
            initiateServer();
        }
    } );


    function initiateServer() {
        server = require( './lib/server.js' );

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

        pi.upsertPI( piObj );
    }

    function initiateProximityScanner() {
        scanner = require( './lib/proximity.js' );
        scanner.start( scannerConfig );
    }
}() );
