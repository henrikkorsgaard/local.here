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
		locations:[{mac:String, location:String, signal:Number, seen:Date}],
		agent:String,
        ip: String,
		vendor:String,
        hostname: String,
		seen: Date
    } );
	
    let Device = mongoose.model( 'Device', deviceSchema );

    function upsert( device, node ) {

		
		let device_mac = device.mac.toLowerCase();
		
		Device.findOne({mac: device_mac}, (err, d) => {
			
			if(err){
				console.log("Error in Device.findOne();");
				console.log(err)
			}
			
			else if(!d){
				
				let location = {mac:node.mac, ip:node.ip, location:node.location, seen:Date.now()};
				if(device.signal && device.signal !== 'undefined' && device.signal !== 0 ){
					location.signal = device.signal;
				}
				
				d = new Device({
					mac: device_mac,
					ip:device.ip,
					seen:Date.now(),
					locations:[location]
				});
				
				if(device.hasOwnProperty("hostname") && device.hostname !== "unknown"){
					d.hostname = device.hostname;
				}
				
				if(device.hasOwnProperty("vendor") && device.vendor !== "Unknown"){
					d.vendor = device.vendor;
				}
				d.save((err)=>{
					if(err){
						console.log("Error in Device.findOne() - d.save();");
						console.log(err)
					}
				});

			} else {
				if(device.ip !== "0.0.0.0"){
					d.ip = device.ip;
				}

				d.seen = Date.now();
				
				if(!d.hasOwnProperty("hostname") && device.hasOwnProperty("hostname") && device.hostname !== "unknown"){
					d.hostname = device.hostname;
				}
				
				if(!d.hasOwnProperty("vendor") && device.hasOwnProperty("vendor") && device.vendor !== "Unknown"){
					d.vendor = device.vendor;
				}
				
				var found = false;
				for(var i = 0; i < d.locations.length; i++){
					var location = d.locations[i];
					if(location.mac === node.mac){
						if(device.signal && device.signal !== 'undefined' && device.signal !== 0 ){
							if(node.location === "alice-office"){
								console.log("setting signal");
							}
							location.signal = device.signal;
						}
						
						location.seen = Date.now();
						found = true;
					}
				}
				
				if(!found){
					let location = {mac:node.mac, ip:node.ip, location:node.location, seen:Date.now()};
					if(device.signal && device.signal !== 'undefined' && device.signal !== 0 ){
						
						location.signal = device.signal;
					}
					d.locations.push(location);
				}
				
				for(var i = d.locations.length; i <= 0; i--){
					let location = d.locations[i];
					if(location.seen.getTime() < Date.now()-10000){
						console.log("Removing location from: "+d.hostname);
						d.locations.splice(i,1);
					}
				}
				
				d.save((err)=>{
					if(err){
						console.log("Error in Device.findOne() - d.save();");
						console.log(err)
					}
				});
			}
			
		});
		
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
		Device.findOne({ip:ip}, /*{ '_id':0, '__v':0 }, */(err, d) => {
			
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

		let expire = Date.now() - 6000;
		Device.find({}, (err, devices) => {
			if(err){
				console.log("Error in device.js.clean()");
				console.log(err.code);
			}
			for(var i = 0; i < devices.length;i++){
				let device = devices[i];
				let last = new Date(device.seen).getTime();
				if(last < expire){
					console.log("Removing device: "+device.hostname);
					Device.remove({mac:device.mac}, (err, d)=>{
						if(err){console.log(err.code);}
					});
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
