module.exports = ( function () {
    'use strict';
    let mongoose = require( 'mongoose' );
    let Schema = mongoose.Schema;

	
    let deviceSchema = new Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
		locations:[{mac:String, name:String, signal:Number}],
		agent:String,
        ip: String,
		vendor:String,
        hostname: String,
		seen: Date
    } );
	
    let Device = mongoose.model( 'Device', deviceSchema );

    function upsert( device, node ) {
		
		var conditions = {mac:device.mac};
		
		var update = { $set: {ip:device.ip, seen:Date.now()}, $addToSet: { locations: {mac:node.mac, location:node.location, signal:device.signal}}}
		
		if(device.hasOwnProperty("hostname") && device.hostname !== "unknown"){
			update['$set'].hostname = device.hostname;
		}
		
		if(device.hasOwnProperty("vendor") && device.hostname !== "Unknown"){
			update['$set'].vendor = device.vendor;
		}		
		
		var options = {upsert:true, new:true}
		
		Device.findOneAndUpdate(conditions, update, options, (err, d) => {
			if(err){
				console.log("Error in Device.findOneAndUpdate");
				console.log(err);
			} else {
				console.log(d);
			}
			
			
		});
	
		
		//{ $set: { name: 'jason borne' }}
		
		//
		/*
		Device.findOne({mac:device.mac}, (err, d) => {
			if(err){
				console.log("Error: device.js find!");
			}
			if(!d){
				console.log("new device")
				d = new Device({
					mac:device.mac,
					ip: device.ip,
					agent:"unknown",
					locations: [{mac:node.mac, name:node.location, signal:device.signal}],
					vendor: device.vendor,
					hostname: device.hostname,
					lastSeen: Date.now()		
				});
				
				d.save( (err) => {
					if(err){
						console.log(err);
						console.log("Emorror in device.js insert save");
					}
				});
				
			} else {

				if(device.hasOwnProperty("vendor")){
					d.vendor = device.vendor;
				}
				
				if(device.hasOwnProperty("hostname")){
					d.hostname = device.hostname;
				}

				d.ip = device.ip;
				
				var found = false;
				for(var k in d.locations){
					if(d.locations[k].mac === node.mac){
						found = true;
						d.locations[k].signal = device.signal;
					}
				}
				
				if(!found){
					console.log("trying to push location")
					d.locations.push({mac:node.mac, location:node.location, signal:device.signal});
				}
				d.lastSeen = Date.now();
				d.save( (err) => {
					if(err){
						console.log(err);
						console.log("Error in device.js update save");
					}
				});
			}
		});*/
    }
	
	function findAll(callback){
		Device.find({}, { '_id':0, '__v':0 }, (err, devices) => {
			if(err){
				callback({"error": "Device.findAll()"});
			} else if (!devices){
				callback({"this":"that"});
			} else {
				callback(devices)
			}
		});	
	}
	
	function findThis(ip, agent, callback){
		Device.findOne({ip:ip}, { '_id':0, '__v':0 },(err, d) => {
			
			if(err){
				callback({"error": "Device.findAll()"});
			} else if (!d){
				callback({"device":"unknown"});
			} else {

				d.agent = agent;
				d.save((err, dev) => {
					if(err){
						console.log("Error: device.js findThis save");
					}
					var closestSignal = -100;
					var closestLocation = null;
					for(var k in d.locations){
					
						let node = d.locations[k];
						if(node.signal && node.signal < 0 && node.signal > closestSignal){

							closestSignal = node.signal;
							closestLocation = node;
						}
					}
					d = d.toJSON();
					d.closestLocation = closestLocation;
					delete d.__v;
					delete d._id;
					callback(d);
					
				});
				
			}
		
		});
	}
	
	function clean(){
		
		let cleanTime = Date.now() - 6000;
		Device.find({}, (err, devices)=>{
			if(err){
				callback({"error": "Device.clean()"});
			} else {
				for(var i = 0; i < devices.length; i++){
					let lastSeen = new Date(devices[i].lastSeen).getTime();
					if(lastSeen < cleanTime){
						Device.remove({mac:devices[i].mac}, (err, d)=>{
						});
					}	
				}
			}
			
		});
	}

    return Object.freeze( {
		findThis,
		findAll,
        upsert,
		clean
    } );

}() );
