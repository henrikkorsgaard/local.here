module.exports = (function() {
	'use strict';
	let mongoose = require('mongoose');
	let http = require('http');
	let Schema = mongoose.Schema;
	
	let vendorSchema = new Schema({
		mac: {
			type: String,
			required: true,
			unique: true
		},
		vendor: String
	});

	let Vendor = mongoose.model('Vendor', vendorSchema);
	
	function getVendor(mac, callback){
		Vendor.findOne({mac:mac}, (err, vendor)=>{
			if(err){
				console.log("Error in Vendor.findOne(): "+err.code);
			} else if(!vendor){
				
				http.get('http://api.macvendors.com/'+mac, (response)=>{
					let data  = '';
					response.on('data', (d)=>{
						data += d;
					});
					response.on('end', ()=>{
						let vendor = new Vendor({
							mac: mac, 
							vendor:data
						});
						callback(vendor);
						vendor.save((err)=>{
							if(err){
								console.log("Error in vendor.getVendor().save: "+err.code);
							}
						});
					});
				});
			} else {
				callback(vendor);
			}
		});
		
	}
	
	return Object.freeze({
		getVendor
	});

}());
	