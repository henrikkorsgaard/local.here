(function(){
    'use strict'
    let os = require('os');
    let exec = require( 'child_process' ).exec;
    let interfaces = os.networkInterfaces();
    let ip;
    let ip2;
    let start1 = new Date().getTime();
    console.log(start1);
    for(let iface in interfaces ){
        let ifaceData = interfaces[iface];
        for(let i in ifaceData){
          if(!ifaceData[i].internal && ifaceData[i].family === 'IPv4'){
              ip = ifaceData[i].address;
              break;
          }
        }
    }
    console.log("JSON way :"+(new Date().getTime()-start1));
    let start2 = new Date().getTime();
    console.log(start2);
    exec('ifconfig', function(err, stdout, stderr){
        console.log(stdout);
        console.log("Exec way :"+(new Date().getTime()-start2));
    });


    /*
    let http = require('http');
    http.createServer(function (req, res) {
        let request_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; //Forced as IPv6
        let result;
        if(req.url === '/devices' && req.method === 'GET'){
            result = 'get devices'; //IF VALID REQUEST - RETURN DEVICE LIST
        } else if (req.url.indexOf('/devices/') === 0 && req.method === 'GET'){
            result = 'get particular device';
        } else if (req.url === '/token' && req.method === 'GET'){
            result = 'get 4 hour token';
        } else if (req.url === '/token' && req.method === 'POST'){
            result = 'Post to validate token';
        }
        //Scenario 1 -
        let tokenSchema = new mango.Scheme({
            tokenID: {type:String, require:true, unique:true},
            requestDevice:[{mac:String, signal: Number, mac_resolved:String, ip: String, name:String}],
            valid:Boolean,
            created: { type: Date, default: Date.now}
        });
        res.end('It Works!! result: ' + result);
    }).listen(1337);

    function generateToken(callback){
        //generate token and insert it in the database
        callback("not implemented", undefined);
    }

    function validateToken(token, callback){

        //search database for a matching device based on token

        callback("not implemented", undefined);
    }

    function validateDevice(ip, callback){

        //search database for a matching device based on the ip
        callback("not implemented", undefined);
    }
    */
}());
