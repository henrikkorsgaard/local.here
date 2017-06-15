module.exports = ( function () {
    'use strict';
    let mongoose = require( 'mongoose' );
    let Schema = mongoose.Schema;
	
	let proxiSchema = mongoose.Schema(
    	{mac:String, name:String,signal:Number}
	,{ _id : false });
	
    let deviceSchema = new Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
		proximagicnodes:[proxiSchema],
		userAgent:String,
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
					proximagicnodes: [{mac:proximagicnode.mac, name:proximagicnode.mac, signal:device.signal}],
					vendor: device.vendor,
					hostname: device.hostname,
					lastSeen: Date.now()		
				});
				
				d.save( (err) => {
					if(err){
						console.log(err);
						console.log("Error in device.js insert save");
					}
				});
				
			} else {
				if(device.hasOwnProperty("vendor")){
					d.vendor = device.vendor;
				}
				
				if(device.hasOwnProperty("hostname")){
					d.hostname = device.hostname;
				}
				
				var found = false;
				for(var k in d.proximagicnodes){
					if(d.proximagicnodes[k].mac === proximagicnode.mac){
						found = true;
						d.proximagicnodes[k].signal = device.signal;
					}
				}
				
				if(!found){
					d.proximagicnodes.push({mac:proximagicnode.mac, name:proximagicnode.mac, signal:device.signal});
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
				callback({});
			} else {
				callback(devices)
			}
		});	
	}
	
	function findThis(ip, agent, callback){
		Device.findOne({ip:ip},{ '_id':0, '__v':0 },(err, d) => {
			if(err){
				callback({"error": "Device.findAll()"});
			} else if (!d){
				callback({});
			} else {
				
				d.userAgent = agent;
				d.save((err)=> {
					if(err){
						console.log("Error: device.js findThis save");
					}
				});
				
				var closestSignal = -100;
				var closestProximagicnode = null;
				for(var k in d.proximagicnodes){
					let node = d.proximagicnodes[k];
					if(node.signal && node.signal < 0 &&node.signal > closestSignal){
						closestSignal = node.signal;
						closestProximagicnode = node;
					}
				}
				d = d.toJSON();
				d.closestProximagicnode = closestProximagicnode;
				console.log(d);
				callback(d);
			}
		});
	}

    return Object.freeze( {
		findThis,
		findAll,
        upsert
    } );

}() );
