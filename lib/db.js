module.exports = function(){
    'use strict';
	
	let mongodb = require('mongoose');
	let db = mongodb.createConnection('mongodb://localhost/webstrat-pi');
	let Proximity, Tokens;
	   
	let proximityScanSchema = new mongodb.Schema( {
		scanner: {mac:{type:String, required:true, unique:true}, ip:String},
		station: {ip:String, mac:String, SSID:String},
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
			
	Proximity = db.model('Proximity',proximityScanSchema);

    function insertToken(token, callback){

    }

    function getToken(tokem, callback){

    }

    function validateToken(token, callback){

    }

    //If several scanners are operating, then this might return more than one
    function getAllDevices(callback){
        Proximity.find({}, callback);
    }

    function getDevice(ip, callback){
        Proximity.findOne({scanner:{ip:ip}}, callback);
    }

    function upsertScanner(mac, scanner, station, callback){
        Proximity.update(mac, {scanner:scanner, station:station},{upsert:true}, callback);
    }

    function upsertDevices(mac, devices, callback){
        Proximity.update(mac, {devices:devices},{upsert:true}, callback);
    }
	
    return Object.freeze({
        getAllDevices,
        getDevice,
        upsertScanner,
        upsertDevices
    });
};
