module.exports = function () {
    'use strict';

    let mongodb = require( 'mongoose' );
    let db = mongodb.createConnection( 'mongodb://localhost/webstrat-pi' );
    let DeviceModel, TokenModel, ScannerModel, StationModel;
	
    let scannerSchema = new mongodb.Schema( {	
		mac: {
                type: String,
                required: true,
                unique: true
            },
        ip: String,
        updatedAt: Date
    } );
	
    let stationSchema = new mongodb.Schema( {
		mac: {
                type: String,
                required: true,
                unique: true
		},
		ip: String,
		SSID: String,
        updatedAt: Date
    } );
	
    let deviceSchema = new mongodb.Schema( {
		mac: {
                type: String,
                required: true,
                unique: true
		},
		signal: Number,
		mac_resolved: String,
		ip: String,
		name: String,
        updatedAt: Date
    } );

    let tokenSchema = new mongodb.Schema( {
        device:{ip: {type:String, require:true,unique:true}, mac:String, name:String},
        privateKey:String,
        publicKey:String,
        updatedAt: Date
    } );

    DeviceModel = db.model( 'Device', deviceSchema );
    TokenModel = db.model( 'Token', tokenSchema );
	ScannerModel = db.model( 'Scanner', scannerSchema );
	StationModel = db.model( 'Station', stationSchema );

    function insertToken( token, callback ) {

    }

    function removeToken( tokem, callback ) {

    }

    function getToken( token, callback ) {

    }

    //If several scanners are operating, then this might return more than one
    function getAllDevices( callback ) {
        DeviceModel.find({}, callback );
    } 

    function getDevice( ip, callback ) {
        DeviceModel.findOne({'ip':ip}, callback );
    }
	
    function removeDevice( ip, callback ) {
		console.log("removing device " + ip);
        DeviceModel.remove({'ip':ip}, callback );
    }

    function upsertScanner(scanner, callback ) {
		scanner.updatedAt = Date.now();
        ScannerModel.update(scanner.mac, scanner, {
            upsert: true
        }, function(err, result){
        	callback(err, result);
        } );
    }
	
    function upsertStation(station, callback ) {
		station.updatedAt = Date.now();
        StationModel.update(station.mac, station, {
            upsert: true
        }, function(err, result){
        	callback(err, result);
        });
    }

    function upsertDevice(device, callback ) {
		console.log("upserting device " + device);
		device.updatedAt = Date.now();
        DeviceModel.update(device.ip, device, {
            upsert: true
        }, function(err, result){
        	callback(err, result);
        } );
	}

    return Object.freeze( {
        getAllDevices,
        getDevice,
		removeDevice,
        upsertScanner,
		upsertStation,
        upsertDevice
    } );
};
