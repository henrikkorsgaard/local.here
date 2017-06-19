'use strict';

let Device = require( './models/device.js' );
let Proximagicnode = require( './models/proximagicnode.js' );

let api = {
    "^\/devices$": {
        func: (q, r) => {
            if(q.method === "GET") {
				Device.findAll((response)=>{
					api.apiResponse(r, response);
				});
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/token$": {
        func: (q, r) => {
            if(q.method === "GET") {
                console.log("TOKEN GET!");
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/this$": {
        func: (q, r) => {
            if(q.method === "GET") {
				let ip = r.connection.remoteAddress;
				let agent = q.headers['user-agent'];
				
                Device.findThis(ip,agent, (d) =>{
                	api.apiResponse(r, d);
                });

            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    "^\/proximagicnode$": {
        func: (q, r) => {
            if(q.method === "GET") {
				Proximagicnode.findAll((response)=>{
					api.apiResponse(r, response);
				});
            } else if (q.method === "POST"){
                api.apiResponse(r, {
                    status: 'ok'
                });
				
				let data = '';
				q.on( 'data', function ( chunk ) {
					data += chunk.toString();
				} );
				
				q.on( 'end', function () {
					Proximagicnode.upsert(JSON.parse(data));
				} );
                
            } else {
                api.unsupportedMethod(q, r);
            }
        }
    },
    unsupportedMethod: (q, r) => {
        api.apiResponse(r, {
            status: 'error',
            response: 'This API request does not support method '+q.method
        });
    },
    apiResponse: (r, msg) => {
        
        r.writeHead( 200, {
        	'Content-Type': 'application/json',
        	'Access-Control-Allow-Origin': '*'
        } );
       
        r.write( JSON.stringify( msg ) );
        r.end();
    }
}

module.exports.api = api;
