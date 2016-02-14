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
/*
page.open( config.server + '/' + config.webstrate, function ( status ) {
    if ( status !== 'success' ) {
        console.error( 'Unable to connection to the webstrate server <' + config.server + '>' );
        phantom.exit( 1 );
    }
} );
*/

page.open( "http://devices.here", function ( status ) {
    if ( status !== 'success' ) {
        console.error( 'Unable to connection to the webstrate server <' + config.server + '>' );
        phantom.exit( 1 );
    }
} );

page.onInitialized = function () {
    page.onCallback = function ( data ) {
        if ( data.event === 'loaded' ) {
            //console.log( "Phantom loaded the " + config.webstrate + " webstrate on " + config.server );
        } else if ( data.event === 'api loaded' ) {
            console.log( "Phantom loaded the webstrate api for /" + config.webstrate + " on /" + config.webstrate + "api" );
        }
    };
    page.evaluate( function ( ws, ip, port ) {
        document.addEventListener( 'loaded', function () {
			var nodes = document.getElementsByTagName('PROXIMAGIC');
			for(var i = 0;i<nodes.length;i++){
				if(nodes[i].dataset.ip === ip){
					nodes[i].parentNode.removeChild(nodes[i]);
				}
			}
			
			document.body.innerHTML += '<proximagic data-ip="'+ip+'" data-port="'+port+'" data-webstrate="'+ws+'"style="display:none;"></proximagic>';
			
			/*
            function addIframes() {
                var apiIframe = document.getElementById( 'api' );

                if ( apiIframe ) {
                    apiIframe.setAttribute( 'ip', ip );
                } else {
                    apiIframe = document.createElement( 'iframe' );
                    apiIframe.src = '/' + ws + '-api';
                    apiIframe.id = 'api';
                    apiIframe.setAttribute( 'ip', ip );
                    document.body.appendChild( apiIframe );
                }
				
				var viewIframe = document.getElementById( 'view' );
				
                if ( viewIframe ) {
                    
                } else {
                    viewIframe = document.createElement( 'iframe' );
                    viewIframe.src = '/' + ws + '-view';
                    viewIframe.id = 'view';
                    document.body.appendChild( viewIframe );
                }

                apiIframe.addEventListener( 'transcluded', function () {
                    var doc = apiIframe.contentDocument || apiIframe.contentWindow.document;
                    var ipDiv = doc.getElementById( 'pi-ip' );
                    if ( ipDiv ) {
                        ipDiv.innerHTML = ip;
                    } else {
                        ipDiv = doc.createElement( 'div' );
                        ipDiv.id = 'pi-ip';
                        ipDiv.innerHTML = ip+":"+port;
                        doc.body.appendChild( ipDiv );
                    }

                    var config = {
                        attributes: true,
                        childList: true,
                        characterData: true,
                        subtree: true
                    };
                    //This mutation observer governs the IP an ensures that it always displays the correct IP in PI uptime
                    var ipGovernor = new MutationObserver( function ( mutations ) {
                        ipDiv.innerHTML = ip;
                    } );

                    ipGovernor.observe( ipDiv, config );

                    var eventDiv = doc.getElementById( 'pi-events' );
                    if ( eventDiv ) {
                        eventDiv.innerHTML = '';
                    } else {
                        eventDiv = doc.createElement( 'div' );
                        eventDiv.id = 'pi-events';
                        eventDiv.className = 'api-essential';
                        doc.body.appendChild( eventDiv );
                    }

                    var pingObserver = new MutationObserver( function ( mutations ) {
                        mutations.forEach( function ( m ) {
                            if ( m.type === 'childList' && m.addedNodes.length > 0 && m.addedNodes[ 0 ].tagName === 'PING' ) {
                                var eventId = m.addedNodes[ 0 ].id;
                                console.log( "Got pinged from " + ws + "-api!" );
                                if ( m.addedNodes[ 0 ] ) {
                                    m.addedNodes[ 0 ].parentNode.removeChild( m.addedNodes[ 0 ] );
                                }
                                eventDiv.innerHTML += '<pong id="' + eventId + '"></pong>';
                            }
                        } );
                    } );

                    pingObserver.observe( eventDiv, config );

                    window.callPhantom( {
                        "event": "api loaded"
                    } );
                }, false );
            } 
            addIframes();
			*/
            window.callPhantom( {
                "event": "loaded"
            } );
        }, false );
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
