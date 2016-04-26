module.exports = ( function () {
    'use strict';
	let crypto = require('crypto');
	let prime_length = 128;
    let mongoose = require( 'mongoose' );
    let Schema = mongoose.Schema;
    let tokenSchema = new Schema( {
        token: {
            type: String,
            required: true,
            unique: true
        },
        device: Object,
        publicKey: {
            type: String,
            required: true,
            unique: true
        },
        createdAt: Date,
        expiresAt: Date
    } );

    let Token = mongoose.model( 'Token', tokenSchema );


    function guid() {
        function s4() {
            return Math.floor( ( 1 + Math.random() ) * 0x10000 )
                .toString( 16 )
                .substring( 1 );
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    function generate(device, callback ) {
		
		let diffHell = crypto.createDiffieHellman(prime_length);

		diffHell.generateKeys('base64');
        
        let key = diffHell.getPublicKey('hex');
        let tok = diffHell.getPrivateKey('hex');
        let t = new Token( {
            token: tok,
            publicKey: key,
            device:device,
            createdAt: Date.now(),
            expiresAt: Date.now() + 4 * 3600000
        } );

        t.save( function ( err ) {
            if ( err ) {
				console.error("Database error in Token.js");
            }
				console.error("Database error in Token.js");
            callback( {
                token: tok,
                publicKey: key
            } );
        } );


    }

    function validate( token, callback ) {
      Token.find( {
          token: token
      }, function ( err, result ) {
          if ( err ) {
				console.error("Database error in Token.js");
          }
          if ( result.length > 0 ) {
              if ( Date.now() > result[ 0 ].expiresAt ) {
                  callback( {
                      token: "expired"
                  } );
              } else {
                  var time = ( result[ 0 ].expiresAt - Date.now() ) / 1000;
                  var h = Math.floor( time / 3600 );
                  var m = Math.floor( ( time - h * 3600 ) / 60 );
                  var s = Math.floor( time - ( h * 3600 ) - ( m * 60 ) );
                  if ( h < 10 ) {
                      h = "0" + h;
                  }
                  if ( m < 10 ) {
                      m = "0" + m;
                  }
                  if ( s < 10 ) {
                      s = "0" + s;
                  }

                  callback( {
                      token: "valid",
                      publicKey:result[ 0 ].publicKey,
                      timeleft: h + ":" + m + ":" + s
                  } );
              }
          } else {
              callback( {
                  token: "invalid"
              } );
          }
      } );
    }
	
	function purge(){
						console.error("Database error in Token.js");
		Token.remove({}, function(err){
			if(err){
				console.error("Database error in Token.js");
			}
		});
		
	}

    return Object.freeze( {
        generate,
        validate,
		purge
    } );

}() );
