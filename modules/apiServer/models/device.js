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
        mac_resolved: String,
        user_agent: String,
        ip: String,
        name: String,
        updatedAt: {type :Date, default: Date.now}
    } );

    let Device = mongoose.model('Device', deviceSchema);

    function logDevice(device){

    }

    function upsert(device, cb){
      device = JSON.parse(device);
        Device.update(device.mac, device, {upsert:true}, function(err){
            if(err){
                GLOBAL.LOGGER.log("Error updating device database", "FATAL", __filename);
            } else {
                cb();
            }

        });
    }

    function remove(mac, cb){
        Device.remove({mac:mac}, function(err){
            if(err){
                GLOBAL.LOGGER.log("Error removing device from database", "FATAL", __filename);
            } else {
                cb();
            }
        });
    }

    function getAll(cb){
        Device.find({}, function(err, result){
          if(err){
              GLOBAL.LOGGER.log("Error getting devices from database", "FATAL", __filename);
          } else {
              cb(result);
          }
        });
    }

    function getWithMac(mac, cb){
        Device.findOne({mac:mac}, function(err, device){
          if(err){
              GLOBAL.LOGGER.log("Error getting devices from database", "FATAL", __filename);
          } else {
              cb(device);
          }
        });
    }

    function getWithIP(ip, cb){
        Device.findOne({ip:ip}, function(err, device){
          if(err){
              GLOBAL.LOGGER.log("Error getting devices from database", "FATAL", __filename);
          } else {
              cb(device);
          }
        });
    }

    return Object.freeze({
        upsert,
        remove,
        getWithMac,
        getWithIP,
        getAll
    });

}() );
