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
        updatedAt: {
            type: Date,
            default: Date.now
        }
    } );
	
    let stationSchema = new mongodb.Schema( {
		mac: {
                type: String,
                required: true,
                unique: true
		},
		ip: String,
		SSID: String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
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
        updatedAt: {
            type: Date,
            default: Date.now
        }
    } );

    let tokenSchema = new mongodb.Schema( {
        device:{ip: {type:String, require:true,unique:true}, mac:String, name:String},
        privateKey:String,
        publicKey:String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
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
        DeviceModel.find( {}, callback );
    } 

    function getDevice( ip, callback ) {
        DeviceModel.findOne({}, callback );
    }

    function upsertScanner(scanner, callback ) {
        ScannerModel.update(scanner, {
            upsert: true
        }, callback );
    }
	
    function upsertStation(station, callback ) {
        StationModel.update(station, {
            upsert: true
        }, callback );
    }

    function upsertDevice(device, callback ) {
		
    }

    return Object.freeze( {
        getAllDevices,
        getDevice,
        upsertScanner,
		upsertStation,
        upsertDevice
    } );
};
