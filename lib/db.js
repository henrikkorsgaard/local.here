module.exports = function(){
    'use strict';
    let mongoose = require('mongoose');
    let mongodb = mongoose.connection;
	let Proximity, Tokens;
	
	try {
	    if (mongoose.model('Proximity')){
	    	Proximity = mongoose.model('Proximity');
	    }	
	} catch(e) {
	    if (e.name === 'MissingSchemaError') {
			console.log(e);
		   let proximityScanSchema = new mongoose.Schema( {
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
			
			Proximity = mongodb.model('Proximity',proximityScanSchema);
	    }
	  }

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
