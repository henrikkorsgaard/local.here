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
        stationMAC: String,
        stationIP: String,
        ssid: String,
		name: String,
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
        PI.update({mac:pi.mac}, pi, {
            upsert: true
        }, function ( err, op ) {
            if ( err ) {
				console.error("Database error in Pi.js");
            } else {
                cb();
            }

        } );
    }

    function getPI( cb ) {
        PI.findOne( {},'-_id', function ( err, pi ) {
            if ( err ) {
				console.error("Database error in Pi.js");
            } else {
                cb( pi );
            }
        } );
    }
	
	function purge(){
		GLOBAL.LOGGER.log( "Purging PI DB collection", "LOG", __filename );
		PI.remove({}, function(err){
			if(err){
				console.error("Database error in Pi.js");
			}
		});
		
	}

    return Object.freeze( {
        getPI,
        upsert,
		purge
    } );

}() );
