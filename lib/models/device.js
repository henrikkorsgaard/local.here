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
        signal: Number,
        user_agent: String,
        ip: String,
		vendor:String,
        hostname: String,
        updatedAt: Date
    } );

    let deviceLogSchema = new Schema( {
        mac: String,
        signals: [ Number ],
        user_agent: String,
		vendor: String,
        ip: String,
        hostname: String,
        createdAt: Date,
        removedAt: Date
    } );


    let Device = mongoose.model( 'Device', deviceSchema );
    let DeviceLog = mongoose.model( 'DeviceLog', deviceLogSchema );
	
	function cleanup(cb){
		let expired = (new Date(Date.now()-120000));
		Device.find({ $and: [{$or: [{updatedAt:{$lt: expired}}]},{ $or: [{name:{$exists: false}}]}]}, function(err, doc){
			if ( err ) {
                console.error("Database error in Device.js");
            }
			if(doc){
				for(var i = 0;i<doc.length;i++){
					remove(doc[i].mac, function(){});
				}
			}
			cb();
		});
	}

    function logDevice( device ) {
		device.createdAt = Date.now();
		if(device.hasOwnProperty('signal')){
			device.$push = {signals:device.signal};
			DeviceLog.findOneAndUpdate({mac:device.mac, removedAt:{$exists: false}}, device,{upsert:true},function(err, doc){
	            if ( err ) {
	               console.error("Database error in Device.js");
	            } 
			});
		} else {

			DeviceLog.findOneAndUpdate({mac:device.mac, removedAt:{ $exists: false}}, device,{upsert:true}, function(err, doc){
	            if ( err ) {
	                console.error("Database error in Device.js");
	            } 
			});
		}
		
    }

    function logDeviceRemove( deviceMac ) {
		DeviceLog.findOneAndUpdate({mac:deviceMac, removedAt:{$exists: false}}, {removedAt: Date.now()}, function(err, doc){
            if ( err ) {
                console.error("Database error in Device.js");
            }
		});
    }

    function upsert( device, cb ) {
        device = JSON.parse( device );
		device.updatedAt = Date.now();
		logDevice(device);
        Device.findOneAndUpdate( {mac:device.mac}, device, {
            upsert: true,
			new: true
        }, function ( err, doc ) {
            if ( err ) {
                console.error("Database error in Device.js");
				
            } else {
                cb();
            }
        } );
    }

    function remove( mac, cb ) {
        logDeviceRemove( mac );
        Device.remove( {
            mac: mac
        }, function ( err, doc ) {
            if ( err ) {
               console.error("Database error in Device.js");
            } else {
                cb();
            }
        } );
    }

    function getAll( cb ) {
        Device.find( {}, '-_id -__v',  function ( err, result ) {
            if ( err ) {
				console.error("Database error in Device.js");
            } else {
				console.log(result);
                cb( result );
            }
        } );
    }

    function getWithMac( mac, cb ) {
        Device.findOne( {
            mac: mac
        },'-_id -__v', function ( err, device ) {
            if ( err ) {
                console.error("Database error in Device.js");
            } else {
                cb( device );
            }
        } );
    }

    function getWithIP( ip, cb ) {
        Device.findOne( {
            ip: ip
        },'-_id -__v',function ( err, device ) {
            if ( err ) {
                console.error("Database error in Device.js");
            } else {
                cb( device );
            }
        } );
    }

    function getHistory(cb) {
        DeviceLog.find( {},'-_id -__v' , function ( err, result ) {
            if ( err ) {
                console.error("Database error in Device.js");
            } else {
                cb( result );
            }
        } );
    }
	
	function purge(){
		console.error("Database error in Device.js");
		Device.remove({}, function(err){
			if(err){
	        	console.error("Database error in Device.js");
			}
		});
		
		DeviceLog.remove({}, function(err){
			if(err){
	        	console.error("Database error in Device.js");
			}
		});
	}

    return Object.freeze( {
        upsert,
        remove,
        getWithMac,
        getWithIP,
        getAll,
        getHistory,
		purge,
		cleanup
    } );

}() );
