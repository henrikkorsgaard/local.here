module.exports = (function() {
	'use strict';
	let mongoose = require('mongoose');
	let Schema = mongoose.Schema;

	let macRegExp = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

	let deviceSchema = new Schema({
		mac: {
			type: String,
			required: true,
			unique: true
		},
		locations: [{
			mac: String,
			location: String,
			signal: Number,
			seen: Date
		}],
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
			if(ws.readyState === 1){
				ws.send(JSON.stringify(msg));
			}
			
		});
	}

	function upsert(device, node) {
		if (device.mac.match(macRegExp)) {
			let device_mac = device.mac.toLowerCase();

			Device.findOne({
				mac: device_mac
			}, (err, d) => {

				if (err) {
					console.log("Error in Device.findOne();");
					console.log(err.code)
				} else if (!d) {

					let location = {
						mac: node.mac,
						ip: node.ip,
						location: node.location,
						seen: Date.now()
					};
					if (device.signal && device.signal !== 'undefined' && device.signal !== 0) {
						location.signal =
							device.signal;
					}

					d = new Device({
						mac: device_mac,
						ip: device.ip,
						seen: Date.now(),
						locations: [location]
					});

					if (device.hasOwnProperty("hostname") && device.hostname !== "unknown") {
						d.hostname = device.hostname;
					}

					if (device.hasOwnProperty("vendor") && device.vendor !== "Unknown") {
						d.vendor = device.vendor;
					}
					d.save((err, d) => {
						if (err) {
							console.log("Error in Device.findOne() - d.save();");
							console.log(err.code);
							d.save((err, d) => {
								if(err){
									console.log("Error in Device.findOne() - d.save() --- AGAIN;");
									console.log(err.code);
								} else {
									webSocketSend({
										event: "deviceJoin",
										data: {device: d}
									});
								}
							});
						} else {
							webSocketSend({
								event: "deviceJoin",
								data: {device: d}
							});
						}
					});

				} else {
					if (device.ip !== "0.0.0.0") {
						d.ip = device.ip;
					}

					d.seen = Date.now();

					if (!d.hasOwnProperty("hostname") && device.hasOwnProperty("hostname") && device.hostname !== "unknown") {
						d.hostname = device.hostname;
					}

					if (!d.hasOwnProperty("vendor") && device.hasOwnProperty("vendor") && device.vendor !== "Unknown") {
						d.vendor = device.vendor;
					}

					var found = false;
					for (var i = 0; i < d.locations.length; i++) {
						var location = d.locations[i];
						if (location.mac === node.mac) {
							if (device.signal && device.signal !== 'undefined' &&
								device.signal !== 0 && location.signal !== device.signal) {
								location.signal = device.signal;
								webSocketSend({
									event: "deviceSignalChange",
									data: {device: d, location: location}
								});
							}
							location.seen =
								Date.now();
							found = true;
						}
					}

					if (!found) {
						let location = {
							mac: node.mac,
							ip: node.ip,
							location: node.location,
							seen: Date.now()
						};
						if (device.signal && device.signal !== 'undefined' && device.signal !== 0) {
							location.signal = device.signal;
						}

						d.locations.push(location);
						webSocketSend({
							event: "deviceJoinedLocation", data: {
								device: d,
								location: location
							}
						});
					}

					for (var i = d.locations.length; i <= 0; i--) {
						let location = d.locations[i];
						if (location.seen.getTime() < Date.now() - 10000) {
							console.log("Removing location from: " + d.hostname);
							d.locations.splice(i, 1);
							webSocketSend({
								event: "deviceLeftLocation",
								data: {
									device: d,
									location: location
								}
							});
						}
					}

					d.save((err) => {
						if (err) {
							console.log("Error in Device.findOne() - d.save();");
							console.log(err)
						}
					});
				}

			});
		} else {
			console.log("unknown mac address:  " + device.mac);
		}
	}

	function findAll(callback) {
		Device.find({}, {
			'_id': 0,
			'__v': 0
		}, (err, devices) => {
			if (err) {
				callback({
					"error": "Device.findAll()"
				});
			} else if (!devices) {
				callback({
					"this": "that"
				});
			} else {
				callback(devices)
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

	function clean() {

		let expire = Date.now() - 7000;
		Device.find({}, (err, devices) => {
			if (err) {
				console.log("Error in device.js.clean()");
				console.log(err.code);
			}
			for (var i = 0; i < devices.length; i++) {
				let device = devices[i];
				let last = new Date(device.seen).getTime();
				if (last < expire) {
					webSocketSend({
						event: "deviceLeft",
						data: {device:device}
					});
					Device.remove({
						mac: device.mac
					}, (err, d) => {
						if (err) {
							console.log(err.code);
						}
					});
				} else if (device.mac === "<incomplete>") {
					webSocketSend( {event: "deviceLeft",	data: {device:device}});
					Device.remove({
						mac: device.mac
					}, (err, d) => {
						if (err) {
							console.log(err.code);
						}
					});
				}
			}

		});
	}

	return Object.freeze({
		findThis,
		findAll,
		findByName,
		findByMac,
		upsert,
		clean,
		addWebSocketConnection,
		removeWebSocketConnection
	});

}());
