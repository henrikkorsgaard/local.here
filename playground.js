(function(){
    'use strict';
    let crypto = require('cryptico');
    let db = require( './lib/db.js' )();
	
	db.getAllDevices(function(err, result){
		console.log(err);
		console.log(result);
		
	});
	
	db.getDevice('92.168.1.123',function(err, result){
		console.log(err);
		console.log(result);
		
	});

    //let privateKey = crypto.generateRSAKey("192.168.1.1:SOME MAC ADDRESS", 1024);
    //let publicKey = crypto.publicKeyString(privateKey);
    //console.log(publicKey);
}());
