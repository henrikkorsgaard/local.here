/*global console, process, require*/
(function () {
'use strict';
let fs = require('fs'),
child_process = require('child_process');

let configFile = (process.argv[2] && process.argv[2].indexOf('.conf') === process.argv[2].length - 5) ? process.argv[2] : 'webstrate-pi.conf';
let config;
let phantom_process;
let APIs = [];

fs.readFile(configFile, 'utf8', function(err, data){
    try {
        if(err) { throw err; }
        config = JSON.parse(data);
        init();
    } catch (e){
        console.log(e);
        console.error("Unable to read configuration file <"+configFile+">");
        process.exit(1);
    }
});

function init(){

    //setupBrowser();

    config.api_list.forEach(function(o){
        let api = require('./lib/'+o.name+'.js')();
        api.setPort(o.port);
        api.addEventListener(function(e){
            console.log(e);
        });
        api.init();
    });

}
 function setupBrowser(){
    phantom_process = child_process.spawn('phantomjs',['./scripts/phantom-pi-ws.js', JSON.stringify(config)]);

    phantom_process.stdout.on('data', function (data) {
        let msg = data.toString();
        console.log(msg);
    });

    phantom_process.stderr.on('data', function (data) {
        let msg = data.toString();
        console.log(msg);
    });

    phantom_process.on('error', function(err){
        console.error("Process error!");
        console.log(err);
    });

    phantom_process.on('close', function(code){
        console.log("Phantom closed with the following code: "+code);
    });
 }


}());
//Read the configuraion file

//start the neccesary services
//if started -> send the configuration to the phantomjs services
