var page = require( 'webpage' ).create();
var system = require( 'system' );
var args = system.args;

var config;
try {
    config = JSON.parse( args[ 1 ] );
    console.log( "Setting up webstrate " + config.server + "/" + config.webstrate + " on phantomjs with the following PI ip: " + config.ip );
} catch ( e ) {
    console.error( 'Unable to parse the config parameters from <' + args + '>' );
    phantom.exit( 1 );
}
page.settings.userName = config.login;
page.settings.password = config.password;

//to avoid doing to much to the client side/intended scripts. Especially and issue with phantomjs sketchy js eval?
/*
page.open( config.server + '/' + config.webstrate, function ( status ) {
    if ( status !== 'success' ) {
        console.error( 'Unable to connection to the webstrate server <' + config.server + '>' );
        phantom.exit( 1 );
    }
} );
*/


page.open( 'http://devices.here', function ( status ) {
    if ( status !== 'success' ) {
        console.error( 'Unable to connection to the webstrate server <' + config.server + '>' );
        phantom.exit( 1 );
    }
} );

//should not open devices directly - need a govenor
//to detect when the iframe changes (e.g. new js) -> reload... this is very complicated!

page.onInitialized = function () {
    page.onCallback = function ( data ) {
        if ( data.event === 'loaded' ) {
            //console.log( "Phantom loaded the " + config.webstrate + " webstrate on " + config.server );
        } else if ( data.event === 'api loaded' ) {
            console.log( "Phantom loaded the webstrate api for /" + config.webstrate + " on /" + config.webstrate + "api" );
        }
    };
    page.evaluate( function ( phantomjs_ws, phantomjs_ip, phantomjs_port ) {
        document.addEventListener( 'loaded', function () {

				var nodes = document.querySelectorAll('proximagic');
				for(var i = 0;i<nodes.length;i++){
					if(nodes[i].dataset.ip === phantomjs_ip){
						nodes[i].parentNode.removeChild(nodes[i]);
					}
				}
				document.body.innerHTML += '<proximagic data-ip="'+phantomjs_ip+'" data-port="'+phantomjs_port+'" data-webstrate="'+phantomjs_ws+'"></proximagic>';

            window.callPhantom( {
                "event": "loaded"
            } );
        }, false );
		
		/*
        document.addEventListener( 'loaded', function () {
			var hereIframe = document.getElementById('devices-here');
			if(hereIframe){
				hereIframe.setAttribute( 'src', 'http://devices.here' );
			} else {
	            hereIframe = document.createElement( 'iframe' );
	            hereIframe.src = 'http://devices.here';
	            hereIframe.id = 'devices-here';
				document.body.appendChild( hereIframe );
	        }
		
			var scriptObserver = new MutationObserver(function(mutations){
				mutations.forEach(function(mutation){
					console.log("xomg - script mutation!");
				});
			});
		
			hereIframe.addEventListener('transcluded', function(){
				var doc = hereIframe.contentDocument || hereIframe.contentWindow.document;
				
				var nodes = doc.querySelectorAll('proximagic');
				for(var i = 0;i<nodes.length;i++){
					if(nodes[i].dataset.ip === ip){
						nodes[i].parentNode.removeChild(nodes[i]);
					}
				}
				doc.body.innerHTML += '<proximagic data-ip="'+ip+'" data-port="'+port+'" data-webstrate="'+ws+'"style="display:none;"></proximagic>';
			});
            window.callPhantom( {
                "event": "loaded"
            } );
        }, false );
		
		*/
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
