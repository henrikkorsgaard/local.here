/*global console, module*/
module.exports = function () {
    'use strict';
    //Private stuff
    let http = require('http');

    let eventHandlers = {'ready':[], 'error':[],'terminated':[]};
    let ipRE = new RegExp( /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g );
    let db = require( './lib/db.js' )();
    let server;
    let commands = {
        getToken:function(ip, callback){
            //check that device is on the network
            //remove existing tokens on that ip
            //generate private and public key


            //privatekey for that ip/mac
            //publickey for that ip/mac
            callback("Not yet implemented");
        },
        validateToken:function(ip, callback){
            callback("Not yet implemented");
        },
        executeCommand:function(ip, callback){
            callback("Not yet implemented");
        },
        getDevices:function(ip, callback){
            callback("Not yet implemented");
        },
        getDevice:function(ip, callback){
            callback("Not yet implemented");
        },
    };
    function broadcastEvent( event ) {
        let i, len = eventHandlers[event.type].length;
        for ( i = 0; i < len; i += 1 ) {
            eventHandlers[event.type][i]( event );
        }
    }

    //SETUP
    broadcastEvent( {
        type: 'ready',
        msg: "Server is ready to be started",
        origin: __filename + " line:28"
    } );
    //PUBLIC
    let name = 'server';

    server = http.createServer(function (req, res) {
          let response;
          let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).match(ipRE);
          let path = req.url.replace('/', '');
          if(!ip){
            res.statusMessage = "Sorry, unable to establish the required IPv4 origin in the request.";
            response = "Sorry, unable to establish the required IPv4 origin in the request.";
            res.statusCode = 203;
            res.end(response);
          } else {
            ip = ip[0];
            if(commands[path]){
                //SHOULD PROPERLY DO SOMETHING WITH JSON INSTEAD {cmd:whatever, argvs}
                response = commands[path](ip, function(err, result){
                    console.log(err);
                    console.log(result);
                });
            }
          }
          console.log(ip);
          console.log(path);
          res.end(response);
    });

    server.listen( 1337, function() {
        broadcastEvent( {
            type: 'ready',
            msg: "Server is running and listening on port 1337",
            origin: __filename + " line:46"
        } );
        console.log((new Date()) + ' Server is listening on port 8080');
    });



    function stop() {
        //DO SOMETHING WILL YOU!
    }

    function on(event, callback){
        eventHandlers[event].push(callback);
    }

    return Object.freeze( {
        name,
        stop,
        on
    } );
};
