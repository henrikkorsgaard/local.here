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
		useragent:String,
        ip: String,
		vendor:String,
        hostname: String,
        lastSeen: Date
    } );

    let Device = mongoose.model( 'Device', deviceSchema );

    function upsert( device, proximagicnode ) {
		Device.findOne({mac:device.mac}, (err, d) => {
			if(err){
				console.log("Error: device.js find!");
			}
			if(!d){
				d = new Device({
					mac:device.mac,
					ip: device.ip,
					agent:"unknown",
					locations: [{mac:proximagicnode.mac, name:proximagicnode.location, signal:device.signal}],
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
					if(d.locations[k].mac === device.mac){
						found = true;
						d.locations[k].signal = device.signal;
					}
				}
				
				if(!found){
					d.locations.push({mac:proximagicnode.mac, location:proximagicnode.location, signal:device.signal});
				}
				d.lastSeen = Date.now();
				d.save( (err) => {
					if(err){
						console.log(err);
						console.log("Error in device.js update save");
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
		Device.findOne({ip:ip}, { '_id':0, '__v':0 },(err, d) => {
			
			if(err){
				callback({"error": "Device.findAll()"});
			} else if (!d){
				callback({"device":"unknown"});
			} else {

				d.userAgent = agent;
				d.save((err, dev) => {
					if(err){
						console.log("Error: device.js findThis save");
					}
					var closestSignal = -100;
					var closestLocation = null;
					for(var k in d.proximagicnodes){
					
						let node = d.proximagicnodes[k];
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

    return Object.freeze( {
		findThis,
		findAll,
        upsert
    } );

}() );
