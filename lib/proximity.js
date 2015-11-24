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
    let scanSchema = new mongo.Schema({
        scannerMAC: {type: String, required: true, unique: true }, 
        scannerIP: {type: String},
        stationMAC: {type: String}, 
        stationIP: {type: String}, 
        stationSSID: {type: String}, 
        devices: [{mac:String, signal: Number, mac_resolved:String, ip: String, name:String}],
        updatedAt: {type: Date, default: Date.now} 
    });
	let deviceDB;

    //EVENT CONSTS
    const READY = 'READY';
    const INIT_ERROR = 'INIT_ERROR';

    function init(){
        //CHECKING IF MON0 already exist OR add interface mon0 and set it up!
        exec('iw dev mon0 info || iw wlan0 interface add mon0 type monitor;ip link set mon0 up', function(err, stdout, stderr){
            //The stderr: command failed: No such device (-19) is thrown when iw dew mon0 info fails to find the mon0 device - go through OR case
            if(stderr && stderr.indexOf('command failed: No such device (-19)') === -1){
                console.log(stderr);
            }

            if(err){
                console.log(err)
            }

            let scanner;
            try {
                scanner = proximityScanner();
    	        scanner.addEventListener(function(e){
    	            if(e === "READY"){
						mongo.connect('mongodb://localhost/deviceList');
						deviceDB = mongo.model('deviceDB', scanSchema)
                        scanner.start();
						startServer();
    	            } else if (e === "RUNNING"){
    	        		
    	            }
    	       	});
          	} catch(e){
                console.log(e);
          	}
        });

      	setTimeout(function(){
        	scanner.stop();
      	}, 800000);

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
	
	function startServer(){
		let http = require('http');
		    http.createServer(function (req, res) {
		        res.end('It Works!! Path Hit: ' + req.url);
				
		    }).listen(port);
	}

    function proximityScanner(){

        let scan;
        let eventListener;
        let stationMAC, stationSSID, stationIP,stationBC, scannerMAC, scannerIP;
        let clients = {};
        let macRE = new RegExp(/((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}/);
        let ipRE = new RegExp(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g);
      
        exec("iw dev wlan0 link | egrep -w 'SSID|wlan0'; ifconfig wlan0 | egrep -w 'HWaddr|inet addr'; arp -a", function(err, stdout, stderr){
            if(err || stderr) {
              throw new Error("Scanner unable to retrieve station MAC. " + err || stderr);
            } else {
              let lines = stdout.replace(/\t/g,'').split('\n');
              stationMAC = lines[0].match(macRE)[0];
              stationSSID = lines[1].replace('SSID: ', '');
              scannerMAC = lines[2].match(macRE)[0];
              scannerIP = lines[3].match(ipRE)[0];
			  stationBC = lines[3].match(ipRE)[1];

              for(let i = 4; i<lines.length;i += 1){
                  if(lines[i].indexOf(stationSSID) > -1){
                      stationIP = lines[i].match(ipRE)[0];
                      break;
                  }
              }
              eventListener("READY");
            }
        });

        function start(){
            let filter = 'wlan.da=='+stationMAC;
            let timer = new Date().getTime();
            let dbInterval = 2000; //update the database!
			
            scan = spawn('tshark', ['-i','mon0','-l', '-y','IEEE802_11_RADIO','-Y',filter,'-T','fields','-e','wlan.sa','-e','radiotap.dbm_antsignal', '-e', 'wlan.sa_resolved']);

            scan.stdout.on('data', function(data){
                let dataString = data.toString().replace("\n","");
                let dataArray = dataString.split("\t");
                if(dataArray.length === 3 && dataArray[0] !== '' && dataArray[1] !== '' && dataArray[2] !== ''){
                   	if(!clients[dataArray[0]]){
                   		clients[dataArray[0]] = {};
						clients[dataArray[0]].mac = dataArray[0];
						clients[dataArray[0]].signal = dataArray[1];
						clients[dataArray[0]].mac_resolved = dataArray[2];
                   	}
                    clients[dataArray[0]].signal = dataArray[1];
                }

                if(new Date().getTime() > timer + dbInterval){
                    timer = new Date().getTime();
					
					var dbObject = {scannerIP: scannerIP, stationMAC: stationMAC, stationIP:stationIP, stationSSID:stationSSID, devices:clients};
					
					deviceDB.update({scannerMAC:scannerMAC},dbObject,{upsert:true}, function(err, result){
						if(err) {throw new Error("Error upserting data into the database. Error: " + err);}
					});
					
                    for(let obj in clients){
                        if(clients[obj].ip === undefined){
                            updateIpAndName();
                            break;
                        }						
						if(clients[obj].signal === undefined){
							delete clients[obj];
						}
						
						clients[obj].signal = undefined;
                    }
                }
            });

            scan.stderr.on('data', function(data){
                console.log('' + data);
            });

            scan.on('error', function(err){
                console.log("error  "+err);
                //throw new Error("Scanner process failed with error: " + err);
            });

            scan.on('close', function(code){
                console.log("closing "+code);
                //eventListener({"event":"CLOSED", "msg":"Scanner closed with code " + code});
            });

			function updateIpAndName(){
				exec('ping -b -c1 '+stationBC+' 2>&1 >/dev/null;arp -a', function(err, stdout, stderr){
		            if(err || stderr) {
		              console.log(err || stderr);
		            } else {
						let lines = stdout.split('\n');
						
						for(let i = 1; i < lines.length; i += 1){
							if(lines[i].length > 0 && lines[i].indexOf(stationSSID) === -1){
								let mac = lines[i].match(macRE)[0];
								if(clients[mac] !== undefined){
									clients[mac].ip = lines[i].match(ipRE)[0];
									let nameString = lines[i].split(' ')[0];
									clients[mac].name = nameString.substring(0, nameString.indexOf('.'));
								}
							}
						}				
					}
				});
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
