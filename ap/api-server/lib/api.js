'use strict';

module.exports.api = {
    "^\/devices$": {
        func: (q, r) => {
            if(q.method === "GET") {
                console.log("DEVICES GET!");

            } else {
                unsupportedMethod(q, r);
            }
        }
    },
    "^\/token$": {
        func: (q, r) => {
            if(q.method === "GET") {
                console.log("TOKEN GET!");

            } else {
                unsupportedMethod(q, r);
            }
        }
    },
    "^\/this$": {
        func: (q, r) => {
            if(q.method === "GET") {
                console.log("THIS GET!");

            } else {
                unsupportedMethod(q, r);
            }
        }
    },
    "^\/proximitynode$": {
        func: (q, r) => {
            if(q.method === "GET") {
                console.log("proximitynode GET!");
            } else if (q.method === "POST"){
                console.log("proximitynode POST!");
                apiResponse(r, {
                    status: 'ok'
                });
            } else {
                unsupportedMethod(q, r);
            }
        }
    },
    unsupportedMethod: (q, r) => {
        apiResponse(r, {
            status: 'error',
            response: 'This API request does not support method '+q.method
        });
    },
    apiResponse: (r, msg) => {
        if ( msg.status !== 'ok' ) {
            r.writeHead( 418, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            } );
        } else {
            r.writeHead( 200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            } );
        }

        r.write( JSON.stringify( msg ) );
        r.end();
    }
}
