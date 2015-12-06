/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    //remember: https://code.google.com/p/crypto-js/
    //http://www.jcryption.org/#howitworks

    let mongo = require( 'mongoose' );
    let cryptico = require( 'cryptico' );
    let logger = require( '../logger.js' );
    let tokenSchema = new mongo.Schema( {
        signature: {
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

    let TokenModel = mongo.model( 'Token', tokenSchema );

    module.exports = token();

    function token() {

        function validateToken( signature, callback ) {
            TokenModel.findOne( {
                signature: signature
            }, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                } else {
                    if ( result.expiresAt > Date.now() ) {
                        callback( true );
                    } else {
                        callback( false );
                    }
                }
            } );
        }

        function getPublicKey( signature, callback ) {
            TokenModel.findOne( {
                signature: signature
            }, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                } else {
                    if ( result.expiresAt > Date.now() ) {
                        callback( result.publicKey );
                    } else {
                        callback( undefined );
                    }
                }
            } );
        }

        function createToken( device, period, callback ) {
            if ( device.hasOwnProperty( 'mac' ) && device.hasOwnProperty( 'ip' ) && device.hasOwnProperty( 'signal' ) ) {
                let rsaKey = cryptico.generateRSAKey( device.mac, 1024 ); //sticking with the 1024 for now - if going for full client/server crypto, use 2048 and AES
                let publicKey = cryptico.publicKeyString( rsaKey );
                let signature = cryptico.publicKeyID( publicKey );
                let t = {
                    signature: signature,
                    device: device,
                    rsaKey: rsaKey,
                    publicKey: publicKey,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + period * 3600000
                };

                TokenModel.update( signature, t, {
                    upsert: true
                }, function ( err ) {
                    if ( err ) {
                        logger.log( err, "FATAL", __filename );
                    } else {
                        callback( {
                            signature: signature,
                            publicKey: publicKey
                        } );
                    }
                } );
            } else {
                logger.log( "Unable to generate token for device!", "REPORT", __filename );
                callback(undefined);
            }
        }

        return Object.freeze( {
            validateToken,
            getPublicKey,
            createToken
        } );
    }
}() );
