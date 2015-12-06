/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    //remember: https://code.google.com/p/crypto-js/
    //http://www.jcryption.org/#howitworks

    let mongo = require( 'mongoose' );

    let logger = require( '../logger.js' );
    let PISchema = new mongo.Schema( {
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
		peripherals:[String],
        updatedAt: Date
    } );

    let PIModel = mongo.model( 'PI', PISchema );

    module.exports = pi();

    function pi() {

        function upsertPI(pi){
            pi.updatedAt = Date.now();
            PIModel.update(pi.mac, pi, {upsert:true}, function(err){
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }
            });
        }

        function getPI(callback){
            PIModel.findOne({}, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }

                if ( result ) {
                    callback( result );
                } else {
                    callback( undefined ); //Replacing potential null with undefined
                }
            } );
        }

        return Object.freeze( {
            getPI,
            upsertPI
        } );
    }
}() );
