( function () {
    'use strict';
    module.exports = api();
	
	function api(){
		
		function getActiveDevices(sendMessage){
			let device = require('./models/device.js');
			device.getAllDevices(function(err, devices){
				if(err){
					sendMessage({"Error":"Something went wrong!"})
				} else {
					sendMessage({})
				}	
			});
		}
		
		function getDevice(sendMessage){
			let device = require('./models/device.js');
			
		}
		
		function getPI(sendMessage){
			let device = require('./models/pi.js');
		}
		
		function getAPI(sendMessage){
			//this
		}
		
		return Object.freeze({
			getDevices,
			getDevice,
			getPI,
			getAPI
		});
	}
}() );
