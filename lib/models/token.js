/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    //remember: https://code.google.com/p/crypto-js/
    //http://www.jcryption.org/#howitworks

    let mongo = require( 'mongoose' );
    let mongoConnection = mongo.createConnection( 'mongodb://localhost/webstrate-pi' );


    let crypto = require( 'cryptico' );

    let tokenSchema = new mongo.Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
        device: Object,
        rsaKey: Object,
        publicKey: {
            type: String,
            required: true,
            unique: true
        },
        createdAt: Date,
        expiresAt: Date
    } );

    let TokenModel = mongoConnection.model( 'Token', tokenSchema );

    module.exports = token();

    function token() {

        function validateToken( publicKey, callback ) {
            TokenModel.findOne( {
                publicKey: publicKey
            }, function ( err, result ) {
                if ( err ) {
                    callback( err );
                } else {
                    if ( result.expiresAt > Date.now() ) {
                        callback( undefined, true );
                    } else {
                        callback( undefined, false );
                    }
                }
            } );
        }

        function createToken( device, period, callback ) {
            if ( device.hasOwnProperty( 'mac' ) && device.hasOwnProperty( 'ip' ) && device.hasOwnProperty( 'signal' ) ) {
                let rsaKey = crypto.generateRSAKey( device.mac, 1024 ); //sticking with the 1024 for now - if going for full client/server crypto, use 2048 and AES
                let publicKey = crypto.publicKeyString( rsaKey );
                let t = {
                    device: device,
                    rsaKey: rsaKey,
                    publicKey: publicKey,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + period * 3600000
                };

                TokenModel.update( device.mac, t, {
                    upsert: true
                }, function ( err, result ) {
                    callback( err, publicKey );
                } );
            } else {
                callback( "Error: device is missing either mac address, ip or a (active) signal." );
            }
        }

        return Object.freeze( {
            validateToken,
            createToken
        } );
    }
}() );
