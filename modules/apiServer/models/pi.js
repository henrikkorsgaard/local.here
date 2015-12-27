module.exports = ( function () {
    'use strict';

    let mongoose = require( 'mongoose' );
    let Schema = mongoose.Schema;
    let piSchema = new Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
        ip: String,
        stationMac: String,
        stationIP: String,
        SSID: String,
        os: String,
        cpu: String,
        peripherals: [ String ],
        updatedAt: {
            type: Date,
            default: Date.now
        }
    } );

    let PI = mongoose.model( 'PI', piSchema );

    function upsert( pi, callback ) {
        PI.update( pi.mac, pi, {
            upsert: true
        }, function ( err ) {
            if ( err ) {
                GLOBAL.Logger.log("Error upsert PI to database", "FATAL", __filename);
            } else {
                callback();
            }

        } );
    }

    return Object.freeze( {
        upsert
    } );

}() );
