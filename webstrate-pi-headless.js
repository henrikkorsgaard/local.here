var page = require( 'webpage' ).create();
var system = require( 'system' );
var args = system.args;

var config;
try {
    config = JSON.parse( args[ 1 ] );
} catch ( e ) {
    console.error( 'Unable to parse the config parameters from <' + args + '>' );
    phantom.exit( 1 );
}
page.settings.userName = config.login;
page.settings.password = config.password;

//to avoid doing to much to the client side/intended scripts. Especially and issue with phantomjs sketchy js eval?

page.open( config.server + '/' + config.webstrate, function ( status ) {
    if ( status !== 'success' ) {
        console.error( 'Unable to connection to the webstrate server <' + config.server + '>' );
        phantom.exit( 1 );
    }
	console.log("Opened "+config.webstrate);
} );

page.onInitialized = function () {
    
    page.evaluate( function ( phantomjs_ws, phantomjs_ip, phantomjs_port ) {
		var proximagic;
		document.addEventListener("loaded", function() {
			console.log("webstrate loaded");
			document.body.innerHTML = '<proximagicNode ip="'+phantomjs_ip+'" port="'+phantomjs_port+'">Proximagic Node</proximagicNode>';
	        hereIframe = document.createElement( 'iframe' );
	        hereIframe.src = 'http://devices.here';
			//hereIframe.src = 'http://webstrates.cs.au.dk/Nygaard295.devices';
			document.body.appendChild( hereIframe );
			hereIframe.onload = function(e){
				var iframeDoc = hereIframe.contentDocument || hereIframe.contentWindow.document;
				iframeDoc.addEventListener('loaded', function(e){
					var doc = hereIframe.contentDocument || hereIframe.contentWindow.document;
					var proximagicNodes = doc.getElementsByTagName('device-proximagic');
					for(var i = 0;i< proximagicNodes.length; i++){
						if(proximagicNodes[i].dataset.ip === phantomjs_ip){
							proximagic = proximagicNodes[i];
							break;
						}
					
					}
					if(!proximagic){
						proximagic = doc.createElement('device-proximagic');
					}
					proximagic.dataset.ip = phantomjs_ip;
					proximagic.dataset.port = phantomjs_port;
					doc.body.appendChild(proximagic);
					update();
				});
				
			}
			
	        
			//hereIframe.addEventListener('transcluded', function(e){
				//console.log("Transcluded devices.here")
				/*
				var doc = hereIframe.contentDocument || hereIframe.contentWindow.document;
				var proximagicNodes = doc.getElementsByTagName('device-proximagic');
				for(var i = 0;i< proximagicNodes.length; i++){
					if(proximagicNodes[i].dataset.ip === phantomjs_ip){
						proximagic = proximagicNodes[i];
						break;
					}
					
				}
				if(!proximagic){
					proximagic = doc.createElement('device-proximagic');
				}
				proximagic.dataset.ip = phantomjs_ip;
				proximagic.dataset.port = phantomjs_port;
				doc.body.appendChild(proximagic);
				update();*/
				//});

		});
		
		function update(){
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'http://'+phantomjs_ip+':'+phantomjs_port+'/devices');
			xhr.send(null);
			
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
			    	if (xhr.status === 200) {
						try {
							var response = JSON.parse(xhr.responseText);
							var devices = response.devices;
							proximagic.innerHTML = '';
							for(var i = 0;i<devices.length;i++){
								proximagic.innerHTML += '<device data-ip="'+devices[i].ip+'" data-mac="'+devices[i].mac+'" data-signal="'+devices[i].signal+'" data-name="'+devices[i].name+'" data-vendor="'+devices[i].vendor+'"></device>';
							}
						} catch(e){
							console.log(e);
						}
			        } else {
			        	console.log("Potential error in ajax call " + xhr.status + " - " + xhr.responseText);
			    	}
				}
			};	
			setTimeout(update, 10000);
		}
    }, config.webstrate, config.ip, config.port );
};

page.onConsoleMessage = function ( msg ) {
    var consoleMsg = 'CONSOLE: ' + JSON.stringify( msg );
    console.log(msg);
};

page.onError = function ( msg, trace ) {
    console.error(msg);
    phantom.exit( 1 );
};
