module.exports = ( function () {
    'use strict';

    let mongoose = require( 'mongoose' );
	let device = require( './device.js' );
    let Schema = mongoose.Schema;
    let proximagicNodeSchema = new Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
        ip: String,
		name: String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
    } );

    let Proximagicnode = mongoose.model( 'Proximagicnode', proximagicNodeSchema );

    function upsert( pn ) {
		let node = pn.proximagicnode;
		let devices = pn.devices;
		
		Proximagicnode.findOne({mac: node.mac}, (err, n)=>{
			if(err){
				console.log("Error in proximagicnode.js upsert");
			}
			if(!n){
				
				let proximagicnode = new Proximagicnode({
					mac:node.mac,
					ip:node.ip,
					name:node.name,
				});
				
				for(var i = 0; i < devices.length; i++){
					if(devices[i].ip !== '0.0.0.0'){
						device.upsert(devices[i], proximagicnode);
					}
				}
				
				proximagicnode.save((err)=>{
					if(err){
						console.log(err);
						console.log("Error in proximagicnode.js upsert save");
					}
					for(var i = 0; i < devices.length; i++){
						device.upsert(devices[i], proximagicnode);
					}
				})
			} else {
				for(var i = 0; i < devices.length; i++){
					if(devices[i].ip !== '0.0.0.0'){
						device.upsert(devices[i], n);
					}
				}
			}
		});
    }
	
	function findAll(callback){
		Proximagicnode.find({}, { '_id':0, '__v':0 }, (err, nodes) => {
			if(err){
				callback({"error": "Device.findAll()"});
			} else if (!nodes){
				callback({});
			} else {
				callback(nodes)
			}
		});
	}

    return Object.freeze( {
		findAll,
        upsert
    } );

}() );
