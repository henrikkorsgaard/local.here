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

    function upsert(device, callback){
        Device.update(device.mac, device, {upsert:true}, function(err){
            if(err){
                GLOBAL.LOGGER.log("Error updating device database", "FATAL", __filename);
            } else {
                callback();
            }

        });
    }

    function remove(mac, callback){
        Device.remove({mac:mac}, function(err){
            if(err){
                GLOBAL.LOGGER.log("Error removing device from database", "FATAL", __filename);
            } else {
                callback();
            }
        });
    }

    return Object.freeze({
        upsert,
        remove
    });

}() );
