module.exports = function () {
    'use strict';

    let mongodb = require( 'mongoose' );
    let db = mongodb.createConnection( 'mongodb://localhost/webstrat-pi' );
    let Proximity, Tokens;

    let proximityScanSchema = new mongodb.Schema( {
        scanner: {
            mac: {
                type: String,
                required: true,
                unique: true
            },
            ip: String
        },
        station: {
            ip: String,
            mac: String,
            SSID: String
        },
        devices: [ {
            mac: String,
            signal: Number,
            mac_resolved: String,
            ip: String,
            name: String
        } ],
        updatedAt: {
            type: Date,
            default: Date.now
        }
    } );

    let tokenSchema = new mongodb.Schema( {
        device:{ip: {type:String, require:true,unique:true}, mac:String, name:String},
        privateKey:String,
        publicKey:String,
    } );

    Proximity = db.model( 'Proximity', proximityScanSchema );
    Tokens = db.model( 'Tokens', tokenSchema );

    function insertToken( token, callback ) {

    }

    function removeToken( tokem, callback ) {

    }

    function getToken( token, callback ) {

    }

    //If several scanners are operating, then this might return more than one
    function getAllDevices( callback ) {
        Proximity.find( {}, callback );
    }

    function getDevice( ip, callback ) {
        Proximity.findOne( {
            scanner: {
                ip: ip
            }
        }, callback );
    }

    function upsertScanner( mac, scanner, station, callback ) {
        Proximity.update( mac, {
            scanner: scanner,
            station: station
        }, {
            upsert: true
        }, callback );
    }

    function upsertDevices( mac, devices, callback ) {
        Proximity.update( mac, {
            devices: devices
        }, {
            upsert: true
        }, callback );
    }

    return Object.freeze( {
        getAllDevices,
        getDevice,
        upsertScanner,
        upsertDevices
    } );
};
