/*global console, module*/
module.exports = function(){
    'use strict';

    //LIBS
    let exec = require('child_process').exec;
    let spawn = require('child_process').spawn;
    let http = require('http');

    //FIELDS
    let wsHierarchy = {'root': 'proximity', 'children':[]};
    let name = 'proximity';
    let port;
    let eventListener;

    //EVENT CONSTS
    const READY = 'READY';
    const INIT_ERROR = 'INIT_ERROR';

    function init(){
      let cmd = 'iw wlan0 interface add mon0 type monitor && ip link set mon0 up';
      let scanner = proximityScanner();
      scanner.addEventListener(function(e){
          console.log(e);
      });

      try {
          scanner.start();
      } catch(e){
          console.log(e);
      }

      setTimeout(function(){
          scanner.stop();
      }, 10000);
      /*
      exec(cmd, function(err, stdout, stderr){
          if(err || stderr) {
              console.error("Unable to set up interface");
              console.error(err);
              process.exit(1);
          }
          setupServer();
      });
      */
      setTimeout(function(){
          eventListener(READY);
      }, 1000);
    }

    function setPort(p){
        port = p;
    }

    function getPort(){
        return port;
    }

    function getWebstrateHierarchy(){
        return wsHierarchy;
    }

    function addEventListener(callback){
        eventListener = callback;
    }

    function proximityScanner(){

        let scan;
        let eventListener;

        function start(){
            scan = spawn('tshark', ['-l']);

            scan.stdout.on('data', function(data){
                console.log('' + data);
            });

            scan.stderr.on('data', function(data){
                console.log('' + data);
            });

            scan.on('error', function(err){
                throw new Error("Scanner process failed with error: " + err);
            });

            scan.on('close', function(code){
                eventListener({"event":"CLOSED", "msg":"Scanner closed with code " + code});
            });
        }

        function stop(){
            scan.kill();
            scan = undefined;
        }

        function addEventListener(callback) {
            eventListener = callback;
        }

        return Object.freeze({
            start,
            stop,
            addEventListener
        });

    }

    return Object.freeze({
        name,
        init,
        getWebstrateHierarchy,
        setPort,
        getPort,
        addEventListener
    });
};
