(function(){
    'use strict';
    let crypto = require('cryptico');
    let db = require( './lib/db.js' )();
	
	db.getDevice('192.168.1.123',function(err, result){
		if(result){
			console.log(result);
			console.log(result.signal);			
			
			let privateKey = crypto.generateRSAKey("test er lige de her", 512);
			let publicKey = crypto.publicKeyString(privateKey);
			console.log(publicKey);
			console.log("hep");
		} else {
			console.log("result was null");
		}

		process.exit();
	});

    
}());
