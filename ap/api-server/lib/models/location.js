module.exports = ( function () {
    'use strict';

    let mongoose = require( 'mongoose' );
	let device = require( './device.js' );
    let Schema = mongoose.Schema;
    let LocationSchema = new Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
        ip: String,
		location: String,
        seen: Date
    } );

    let Location = mongoose.model( 'Location', LocationSchema );
	
	let wsConnection;
	
	function setWebsocketConnection(connection){
		wsConnection = connection;
	}

    function upsert( node ) {

		let devices = node.devices;

		Location.findOne({mac: node.mac}, (err, n)=>{
			if(err){
				console.log("Error in location.js upsert");
			}
			if(!n){
				
				let location= new Location({
					mac:node.mac,
					ip:node.ip,
					location:node.location,
					seen:Date.now()
				});
				
				location.save((err, n)=>{
					if(err){
						console.log(err);
						console.log("Error in location.js upsert save");
					}
					
					for(var i = 0; i < devices.length; i++){
						device.upsert(devices[i], n);
					}
				})
			} else {
				n.seen = Date.now();
				for(var i = 0; i < devices.length; i++){
					device.upsert(devices[i], n);
				}
				
				n.save((err, n)=>{
					if(err){
						console.log(err);
						console.log("Error in location.js upsert save");
					}
				})
			}
		});
    }
	
	function findAll(callback){
		Location.find({}, { '_id':0, '__v':0 }, (err, nodes) => {
			if(err){
				callback({"error": "Device.findAll()"});
			} else if (!nodes){
				callback({});
			} else {
				callback(nodes)
			}
		});
	}
	
	function findByName(name, callback){
		Location.findOne({location:name}, { '_id':0, '__v':0 }, (err, n) => {
			if(err){
				callback({"error": "Device.findByName()"});
			} else if (!n){
				callback({"node":"unknown"});
			} else {
				callback(n)
			}
		});
	}
	
	function clean(){

		let expire = Date.now() - 10000;
		Location.find({}, (err, locations) => {
			if(err){
				console.log("Error in device.js.clean()");
				console.log(err.code);
			}
			for(var i = 0; i < locations.length;i++){
				let location = locations[i];
				let last = new Date(location.seen).getTime();
				if(last < expire){
					console.log("Removing location: "+location.location);
					Location.remove({mac:location.mac}, (err, d)=>{
						if(err){console.log(err.code);}
					});
				} 
			}
			
		});
	}

    return Object.freeze( {
		clean,
		findAll,
        upsert,
		findByName,
		setWebsocketConnection
    } );

}() );
