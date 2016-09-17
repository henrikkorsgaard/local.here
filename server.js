/*global console, process, require*/
( function () {
	'use strict';

	process.title = 'proximagic';
	
	var http = require( 'http' );
	var mongo = require( 'mongoose' );
	mongo.connect( 'mongodb://localhost/proximagic' );
	
	var api = require( './lib/api.js' );
	var config = JSON.parse(process.argv[2]);
	var ipRegExp = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
	http.createServer(internalAPIHandler).listen(config.port, '127.0.0.1');
	http.createServer(externalAPIHandler).listen(config.port, config.ip);

	setTimeout(function(){
		
		var options = {
			host: "127.0.0.1",
			port: config.port,
		  	path: '/pi',
		  	method: 'PUT',
		  	headers: {
				'Content-Type': 'application/json',
			}
		};

		var req = http.request(options, function(res) {
		});

		var data = {mac: config.mac, webstrate:config.name, ip: config.ip};
		req.write(JSON.stringify(data));
		req.end();		
	},5000);
	/*
	* Localhost API used for scanners etc.
	*/
	
	function internalAPIHandler(req, res){
		var match = false;
	    for ( var obj in api.internalAPI ) {
	        var re = new RegExp( obj );
	        if ( req.url.match( re ) ) {
	            api.internalAPI[ obj ].fn( req, res );
	            match = true;
	            break;
	        }
	    }
	    if ( !match ) {
	        api.apiRequestReturn( req, {
	            status: 'error',
	            response: "Unknown internal API request."
	        } );
		}
	}
	
	/*
	* External API used for API request on PI ip.
	*/
	
	function externalAPIHandler(req, res){
        
		var requestIp = req.connection.remoteAddress;
        var origin = req.headers.host;
        if ( req.url === '/favicon.ico' ) {
            res.writeHead( 200, {
                'Content-Type': 'image/x-icon'
            } );
            res.end();
			return;
        }
		
		if(requestIp === config.ip){
		    var match = false;
		    for ( var obj in api.webstrateAPI ) {
		        var re = new RegExp( obj );
		        if ( req.url.match( re ) ) {
		            api.webstrateAPI[ obj ].fn( req, res );
		            match = true;
		            break;
		        }
		    }

		    if ( !match ) {
		        api.apiRequestReturn( res, {
		            status: 'error',
		            response: "Unknown proximagicYFI API request."
		        } );
		    } 
		} else {
		    var match = false;
		    for ( var obj in api.externalAPI ) {
		        var re = new RegExp( obj );
		        if ( req.url.match( re ) ) {
		            api.externalAPI[ obj ].fn( req, res );
		            match = true;
		            break;
		        }
		    }
		    if ( !match ) {
		        api.apiRequestReturn( res, {
		            status: 'error',
		            response: "Unknown API request."
		        } );
		    }
		}
	}
}() );


