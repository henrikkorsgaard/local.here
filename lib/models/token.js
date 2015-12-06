/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    //remember: https://code.google.com/p/crypto-js/
    //http://www.jcryption.org/#howitworks

    let mongo = require( 'mongoose' );
    let mongoConnection = mongo.createConnection( 'mongodb://localhost/webstrate-pi' );
    let cryptico = require( 'cryptico' );

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

    let TokenModel = mongoConnection.model( 'Token', tokenSchema );

    module.exports = token();

    function token() {

        function validateToken( userID, callback ) {
            TokenModel.findOne( {
                signature: signature
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
		
		function getPublicKey(userID, callback){
            TokenModel.findOne( {
                signature: signature
            }, function ( err, result ) {
                if ( err ) {
                    callback( err );
                } else {
					callback(undefined, result.publicKey);
                }
            } );
		}

        function createToken( device, period, callback ) {
            if ( device.hasOwnProperty( 'mac' ) && device.hasOwnProperty( 'ip' ) && device.hasOwnProperty( 'signal' ) ) {
                let rsaKey = cryptico.generateRSAKey( device.mac, 1024 ); //sticking with the 1024 for now - if going for full client/server crypto, use 2048 and AES
                let publicKey = cryptico.publicKeyString( rsaKey );
				let userID = cryptico.publicKeyID(publicKey);
                let t = {
					signature: signature,
                    device: device,
                    rsaKey: rsaKey,
                    publicKey: publicKey,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + period * 3600000
                };

                TokenModel.update( userID, t, {
                    upsert: true
                }, function ( err, result ) {
					if(err){
						callback( err );
					} else {
						console.log("result from createToken");
						console.log(result);
						callback( undefined, {signature: signature,  publicKey: publicKey});
					}
                } );
            } else {
                callback( "Error: device is missing either mac address, ip or a (active) signal." );
            }
        }

        return Object.freeze( {
            validateToken,
			getPublicKey,
            createToken
        } );
    }
}() );
