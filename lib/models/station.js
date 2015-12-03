/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    //remember: https://code.google.com/p/crypto-js/
    //http://www.jcryption.org/#howitworks

    let mongo = require( 'mongoose' );
    let mongoConnection = mongo.createConnection( 'mongodb://localhost/webstrat-pi' );

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
        info: String,
        updatedAt: Date
    } );

    let PIModel = mongoConnection.model( 'PI', PISchema );

    module.exports = pi();

    function pi() {

        function upsertPI(pi, callback){
            pi.updatedAt = Date.now();
            PIModel.update(pi, {upsert:true}, callback);
        }

        function getPI(callback){
            PIModel.findOne({}, callback);
        }

        return Object.freeze( {
            getPI,
            upsertPI
        } );
    }
}() );
