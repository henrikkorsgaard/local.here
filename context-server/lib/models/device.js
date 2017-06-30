module.exports = (function() {
	'use strict';
	let mongoose = require('mongoose');
	let Schema = mongoose.Schema;
	let vendor = require('./vendor.js');
	let exec = require('child_process').exec;
	let macRegExp = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

	let deviceSchema = new Schema({
		mac: {
			type: String,
			required: true,
			unique: true
		},
		locations: [{
			mac: String,
			name: String,
			signal: Number,
			seen: Date
		}],
		_complete: Boolean,
		type: {
			type: String,
			default: "wired"
		},
		ip: String,
		vendor: String,
		hostname: String,
		seen: Date
	});

	let Device = mongoose.model('Device', deviceSchema);

	let connections = [];

	function addWebSocketConnection(ws) {
		connections.push(ws);
	}

	function removeWebSocketConnection(ws) {
		connections.splice(connections.indexOf(ws), 1);
	}

	function webSocketSend(msg) {
		connections.forEach((ws) => {
			if (ws.readyState === 1) {
				ws.send(JSON.stringify(msg));
			}
		});
	}

	/**
	 * Returns true if the device data is from the proximity
	 * scanner.
	 */
	const isProximityScanner = (deviceData) => {
		return deviceData.hasOwnProperty("signal");
	};

	const isNMAPScanner = (deviceData) => {
		return deviceData.hasOwnProperty("hostname");
	};

	const isDeviceComplete = (device) => {
		return device._complete; //will turn the undefined into false
	};

	function upsert(deviceData, node, retry) {

		let mac = deviceData.mac.toLowerCase();

		// ignore router and nodes
		if (global.excludedMacAddresses.indexOf(mac) > -1) {
			return;
		}

		Device.findOne({
			mac: mac
		}, (error, device) => {
			if (error) {
				console.error("Error in Device.upsert() at FindOne(). Code: " + error.code);
				return;
			}

			// create a global now
			const NOW = Date.now();

			// device does not exist in database
			if (!device) {

				// create location
				let location = {
					mac: node.mac,
					ip: node.ip,
					name: node.location,
					seen: NOW
				};

				// message from nmap scanning
				if (isNMAPScanner(deviceData)) {
					device = new Device({
						mac: mac,
						type: "wired",
						hostname: deviceData.hostname,
						ip: deviceData.ip,
						locations: [location],
						seen: NOW,
						_complete: false
					});
				}
				// message from proximity scanner
				else {

					// update device's signal for current location
					location.signal = deviceData.signal;

					// create new device based on proximity scanner data
					device = new Device({
						mac: mac,
						type: "wireless",
						locations: [location],
						seen: NOW,
						_complete: false,
					});
				}

				device.save((error) => {
					if (error) {
						console.error("Error in Device.upsert() at save(). Code: " + error.code);

						if (!retry) {
							console.warn("Trying again with " + mac);
							upsert(deviceData, node, true);
						} else {
							console.error("This failed a second time " + mac);
						}

					} else {
						addVendor(deviceData.mac);
					}
				});

			}
			// device exists
			else {

				// update device seen time
				device.seen = NOW;

				// message from nmap scanning
				if (isNMAPScanner(deviceData)) {
					device.hostname = deviceData.hostname;
					device.ip = deviceData.ip;
				}
				// message from proximity scanner
				else {

					// device is wireless because the proximity scanner cannot see wired devices
					device.type = "wireless";
				}

				// queue to add events that will be emitted once the device is persisted in the database
				let eventsToEmit = [];

				// check if device has node's location
				let location = device.locations.find((location) => location.mac === node.mac);

				// device has node's location already
				if (location) {
					// checks if the signal is updated and then adds an event to trigger a signal change event
					if (deviceData.signal && deviceData.signal !== location.signal) {
						location.signal = deviceData.signal;

						eventsToEmit.push({
							event: "deviceSignalChange",
							data: {
								device,
								location
							}
						});
					}
				}
				// location does not exist for device
				else {
					let location = {
						mac: node.mac,
						ip: node.ip,
						name: node.location,
						signal: deviceData.signal,
						seen: NOW
					};

					// add location to device
					device.locations.push(location);

					eventsToEmit.push({
						event: "deviceJoinedLocation",
						data: {
							device,
							location
						}
					});
				}



				// device is only complete if it has property _complete set to true AND it has a hostname AND
				// it has an IP
				let deviceIsComplete = !isDeviceComplete(device) && device.hostname && device.ip;

				if (deviceIsComplete) {

					// set device to be _complete because it has data from proximity sensor and the nmap scan
					device._complete = true;

					eventsToEmit.push({
						event: "deviceJoin",
						data: {
							device
						}
					});
				}

				// get all locations that has been seen by the device in the last 5 seconds
				const timeoutTime = NOW - 5000;
				//const wiredTimeoutTime = NOW - 15000; //15000ms should put us on the safe side of NMAP scans


				for (var i = device.locations.length; i <= 0; i--) {
					let location = device.locations[i];
					if (location.seen < timeoutTime) {
						console.log("Removing location from: " + device.hostname);
						device.locations.splice(i, 1);
						eventsToEmit.push({
							event: "deviceLeftLocation",
							data: {
								device,
								location
							}
						});
					}
				}

				device.save((error, device) => {
					if (error) {
						console.error("Error in Device.upsert() at save() after update. Code: " + error.code);

						if (!retry) {
							upsert(deviceData, node, true);
						} else {
							console.warn("This failed a second time " + mac);
						}
					}
					//if first time complete, then emit deviceJoin
					else {
						if (isDeviceComplete(device)) {
							eventsToEmit.forEach((event) => {
								webSocketSend(event);
							});
						}
					}
				});
			}
		});
	}

	function findAll(callback) {
		Device.find({}, {
			'_id': 0,
			'__v': 0,
			'_complete': 0
		}, (err, devices) => {
			if (err) {
				callback({
					"error": "Device.findAll()"
				});
			} else if (!devices) {
				callback({
					"Error": "No devices found!"
				});
			} else {
				let returnDevices = [];
				for (var d = 0; d < devices.length; d++) {
					let device = devices[d].toJSON();
					var locations = device.locations;
					for (var l = 0; l < locations.length; l++) {
						delete locations[l]['_id'];
					}
					returnDevices.push(device);
				}
				callback(returnDevices)
			}
		});
	}

	function findThis(ip, callback) {
		Device.findOne({
			ip: ip
		}, {
			'_id': 0,
			'__v': 0
		}, (err, d) => {

			if (err) {
				callback({
					"error": "Device.findAll()"
				});
			} else if (!d) {
				callback({
					"device": "unknown"
				});
			} else {
				var closestSignal = -100;
				var closestLocation = null;
				for (var k in d.locations) {
					let node = d.locations[k];
					if (node.signal && node.signal < 0 && node.signal > closestSignal) {
						closestSignal = node.signal;
						closestLocation = node;
					}
				}
				d = d.toJSON();
				d.closestLocation =
					closestLocation;
				delete d.__v;
				delete d._id;
				delete d._complete;
				callback(d);
			}
		});
	}

	function findByMac(mac, callback) {
		Device.findOne({
			mac: mac
		}, {
			'_id': 0,
			'__v': 0
		}, (err, device) => {
			if (err) {
				console.log("Error in device.js.clean()");
				console.log(err.code);
			}
			if (device) {
				callback(device);
			} else {
				callback({
					"error": "device unknown"
				});
			}
		});
	}

	function findByName(name, callback) {
		Device.find({
			hostname: name
		}, {
			'_id': 0,
			'__v': 0
		}, (err, devices) => {
			if (err) {
				console.log("Error in device.js.clean()");
				console.log(err.code);
			}

			if (devices) {
				callback(devices);
			} else {
				callback({
					"error": "device unknown"
				});
			}
		});
	}

	function findByLocation(locationMac, callback) {
		Device.find({
			'locations.mac': locationMac
		}, {
			'_id': 0,
			'__v': 0,
			'_complete': 0,
			'locations._id': 0
		}, (err, devices) => {
			if (err) {
				console.log("Error in device.js FindByLocation()");
				callback([]);
			} else {
				callback(devices);
			}
		});
	}

	function clean() {

		Device.find({}, (err, devices) => {
			if (err) {
				console.log("Error in device.js.clean()");
				console.log(err.code);
			}
			for (var i = 0; i < devices.length; i++) {
				let device = devices[i];

				if (global.excludedMacAddresses.indexOf(device.mac) !== -1) {
					Device.remove({
						mac: device.mac
					}, (err, d) => {
						if (err) {
							console.log(err);
						}
					});

				} else if (device.hostname) {
					exec('ping -c 1 ' + device.ip, {
						timeout: 1000
					}, function(error, stdout, stderr) {
						if (stderr || error) {
							Device.remove({
								mac: device.mac
							}, (err, d) => {
								if (err) {
									console.log(err);
								}

								webSocketSend({
									event: "deviceLeft",
									data: {
										device
									}
								});
								console.log("Device removed " + device.hostname + " (mac: " + device.mac + ")");
							});
						}
					});
				}
			}
		});
	}

	function addVendor(mac) {
		vendor.getVendor(mac, (vendor) => {
			Device.findOneAndUpdate({
				mac: mac
			}, {
				vendor: vendor.vendor
			}, (err) => {
				if (err) {
					console.log("Error in device.js,addVendor(), findOneAndUpdate(): " + err.code);
				}
			});
		});
	}


	return Object.freeze({
		findThis,
		findAll,
		findByName,
		findByMac,
		findByLocation,
		upsert,
		clean,
		addWebSocketConnection,
		removeWebSocketConnection
	});

}());
