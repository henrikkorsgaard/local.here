/*global console, module*/
module.exports = function(){
    'use strict';

    //LIBS
    let exec = require('child_process').exec;
    let spawn = require('child_process').spawn;
    let http = require('http');
	let mongo = require('mongoose');

    //FIELDS
    let wsHierarchy = {'root': 'proximity', 'children':[]};
    let name = 'proximity';
    let port;
    let eventListener;

    //EVENT CONSTS
    const READY = 'READY';
    const INIT_ERROR = 'INIT_ERROR';

    function init(){
		let scanner;
      	try {
			scanner = proximityScanner();
	        scanner.addEventListener(function(e){
	            if(e === "READY"){
					//scanner.start();
	            }
	        });

      	} catch(e){
        	console.log(e);
      	}
	  
      	setTimeout(function(){
        	scanner.stop();
      	}, 800000);
      /*
	  let cmdExec = 'iw wlan0 interface add mon0 type monitor && ip link set mon0 up';
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
		let stationMAC, stationSSID, stationIP, scannerMAC, scannerIP;
		let clients = {};
		
		let scanSchema = new mongo.Schema({
			scannerMAC: {type: String, required: true, unique: true }, //ifconfig wlan0 (grep hwaddr)
			scannerIP: {type: String}, //ifconfig wlan0 (grep inet addr)
			stationMAC: {type: String}, // iw wlan0 link
			stationIP: {type: String}, // arp -a (filter by stationName)
			stationSSID: {type: String}, // iw wlan0 link
			devices: [{mac:String, signal: Number, mac_resolved:String, ip: String, name:String}], //Tshark below and apr -a (mac compare)
			updatedAt: {type: Date, default: Date.now} //self
		});
		
		let startTime = new Date().getTime();
		console.log("Start: " + startTime);
        exec("iw dev wlan0 link | egrep -w 'SSID|wlan0'; ifconfig wlan0 | egrep -w 'HWaddr|inet addr'; arp -a", function(err, stdout, stderr){
			if(err || stderr) {
				throw new Error("Scanner unable to retrieve station MAC. " + err || stderr);
            } else {
				let lineArray = stdout.replace(/\t/g,'').split('\n');
				let macRE = new RegExp(/((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/);
				let ipRE = new RegExp(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
				stationMAC = lineArray[0].match(macRE)[0];
				stationSSID = lineArray[1].replace('SSID: ', '');
				scannerMAC = lineArray[2].match(macRE)[0];
				scannerIP = lineArray[3].match(ipRE)[0];
				for(let i = 4; i<lineArray.length;i += 1){
					if(lineArray[i].indexOf(stationSSID) > -1){
						stationIP = lineArray[i].match(ipRE)[0];
						break;
					}
				}
				eventListener("READY");
            }	
		}); 

        function start(){
			let filter = 'wlan.da=='+stationMAC;
			let timer = new Date().getTime();
			let captureInterval = 1000; //update the database!

			scan = spawn('tshark', ['-i','mon0','-l', '-y','IEEE802_11_RADIO','-Y',filter,'-T','fields','-e','wlan.sa','-e','radiotap.dbm_antsignal', '-e', 'wlan.sa_resolved']);
            scan.stdout.on('data', function(data){
				let dataString = data.toString().replace("\n","");
				let dataArray = dataString.split("\t");
				if(dataArray.length === 3 && dataArray[0] !== '' && dataArray[1] !== '' && dataArray[2] !== ''){
					clients[dataArray[0]] = {"mac": dataArray[0], "signal": dataArray[1], "mac_resolved":dataArray[2]};
				}
					
				if(new Date().getTime() > timer + captureInterval){
					console.log("time has passed");
					timer = new Date().getTime();
					console.log(clients);
					//SEND TO MONGO DB!
				}
            });

            scan.stderr.on('data', function(data){
                //console.log('' + data);
            });

            scan.on('error', function(err){
                console.log("error  "+err);
				//throw new Error("Scanner process failed with error: " + err);
            });

            scan.on('close', function(code){
               	console.log("closing "+code);
			    //eventListener({"event":"CLOSED", "msg":"Scanner closed with code " + code});
            });
			
			function arpScan(){
				//SCAN FOR IPS ON THE NETWORK
			}
			
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
