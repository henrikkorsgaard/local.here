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

    function upsert( device, cb ) {
        device = JSON.parse( device );

        Device.findOne( {
            mac: device.mac
        }, function ( err, d ) {
            if ( err ) {
                console.error("Database error in Device.js");
            } else {

				if(!d){
					var ip = device.ip === '0.0.0.0' ? undefined : device.ip;
					var nDevice = new Device({
						mac:device.mac,
						signal:device.signal,
						vendor:device.vendor,
						ip:ip,
						hostname:device.hostname,
						updatedAt:Date.now()
					});
					nDevice.save(function(err){
						if(err){
							console.log("Database error in Device.js");
						}
					});
				} else {
					device.ip = device.ip === '0.0.0.0' ? d.ip : device.ip;
					device.updatedAt = Date.now();
					for(var k in device){
						d[k] = device[k];
					}
					d.save(function(err){
						if(err){
							console.log("Database error in Device.js [L112]");
						}
					});
				}
				cb();
            }
        } );
    }

    function remove( mac, cb ) {

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
		purge,
		cleanup
    } );

}() );
