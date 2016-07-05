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
		var timer;
		document.addEventListener("loaded", function() {
			var meta = document.getElementById('meta');
			var hereIframe = document.getElementById('devices');
			
			if(!meta){
				meta = document.createElement('div');
				meta.id = 'meta';
				document.body.appendChild( meta );

			}
			meta.style.display = 'none';
			meta.innerHTML ='<proximagicNode ip="'+phantomjs_ip+'" port="'+phantomjs_port+'">Proximagic Node</proximagicNode>';
			
			if(!hereIframe){
		        hereIframe = document.createElement( 'iframe' );
				hereIframe.id = 'devices';
				document.body.appendChild( hereIframe );
			}
			
			hereIframe.src = 'http://devices.here';
			hereIframe.style.display = 'none';
			
			hereIframe.onload = function(e){
				var iframeDoc = hereIframe.contentDocument || hereIframe.contentWindow.document;
				iframeDoc.addEventListener('loaded', function(e){
					var doc = hereIframe.contentDocument || hereIframe.contentWindow.document;
					var proximagicNodes = doc.getElementsByTagName('device');
					for(var i = 0;i< proximagicNodes.length; i++){
						if(proximagicNodes[i].dataset.ip === phantomjs_ip){
							proximagic = proximagicNodes[i];
							break;
						}
					}
					if(!proximagic){
						proximagic = doc.createElement('device');
					}
					proximagic.dataset.ip = phantomjs_ip;
					proximagic.dataset.port = phantomjs_port;
					proximagic.dataset.ws = phantomjs_ws;
					proximagic.dataset.type = "ProximagicNode";
					proximagic.innerHTML ='<name>ProximagicNode</name><description>This device scans the local area network for devices in proximity. Nmap is used to scan the network and establish current LAN/WLAN clients. Horst is used to scan RadioTap headers for WLAN signal strength.</description><api><ul><legend>API requests</legend><li>ip:port/this</li><li>ip:port/devices</li><li>ip:port/devices/{ip|mac}</li></ul></api>';
					doc.body.appendChild(proximagic);
 
					var observer = new MutationObserver(function(mutations) {
					  mutations.forEach(function(mutation) {
						  if(mutation.type === "childList" && mutation.removedNodes.length > 0){
							  for(var i = 0;i<mutation.removedNodes.length;i++){
								  if(mutation.removedNodes[i] === proximagic){
									  if(timer){
										  clearInterval(timer);
									  }
									  
									  setTimeout(function(){
										proximagic = proximagic.cloneNode();
										proximagic.innerHTML ='<name>ProximagicNode</name><description>This device scans the local area network for devices in proximity. Nmap is used to scan the network and establish current LAN/WLAN clients. Horst is used to scan RadioTap headers for WLAN signal strength.</description><api><ul><legend>API requests</legend><li>ip:port/this</li><li>ip:port/devices</li><li>ip:port/devices/{ip|mac}</li></ul></api>';
									  	doc.body.appendChild(proximagic);

									  }, 2000);
								  }
							  }
						  }
					  });    
					});
  
					// pass in the target node, as well as the observer options
					observer.observe(proximagic.parentNode, { attributes: false, childList: true, characterData: false });
				});
				
			}

		});
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
