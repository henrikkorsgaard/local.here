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

    function upsert( pi, cb ) {
        pi = JSON.parse(pi);
        PI.update( pi.mac, pi, {
            upsert: true
        }, function ( err, op ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error upsert PI to database: "+err, "FATAL", __filename );
            } else {
                cb();
            }

        } );
    }

    function getPI( cb ) {
        PI.findOne( {}, function ( err, pi ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error upsert PI to database", "FATAL", __filename );
            } else {
                cb( pi );
            }
        } );
    }

    return Object.freeze( {
        getPI,
        upsert
    } );

}() );
