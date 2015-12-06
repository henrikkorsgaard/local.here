var page = require( 'webpage' ).create();
var system = require( 'system' );
var args = system.args;

var config;
try {
    config = JSON.parse( args[ 1 ] );
    console.log( "Setting up webstrate " + config.webstrate_server + "/" + config.webstrate + " on phantomjs with the following PI ip: " + config.ip );
} catch ( e ) {
    console.error( 'Unable to parse the config parameters from <' + args + '>' );
    phantom.exit( 1 );
}
page.settings.userName = config.webstrate_login;
page.settings.password = config.webstrate_password;


page.open( config.webstrate_server + '/' + config.webstrate, function ( status ) {
    if ( status !== 'success' ) {
        console.error( 'Unable to connection to the webstrate server <' + config.webstrate_server + '>' );
        phantom.exit( 1 );
    }
} );

page.onInitialized = function () {
    page.onCallback = function ( data ) {
        if ( data.event === 'loaded' ) {
            console.log( "Phantom loaded the " + config.webstrate + " webstrate on " + config.webstrate_server );
        } else if ( data.event === 'api loaded' ) {
            console.log( "Phantom loaded the webstrate api for /" + config.webstrate + " on /" + config.webstrate + "_api" );
        }
    };

    page.evaluate( function ( ws, ip ) {
        document.addEventListener( 'loaded', function () {
            var log = document.getElementById( ws + '_console' );
            if ( log ) {
                log.innerHTML = '';
                log.style.display = 'none';
            } else {
                log = document.createElement( 'div' );
                log.id = ws + '_console';
                log.style.display = 'none';
                document.body.appendChild( log );
            }
            var iframe = document.getElementById( ws + '_api' );
            if ( iframe ) {
                iframe.setAttribute( 'ip', ip );
                iframe.addEventListener( 'transcluded', function () {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var ipEl = doc.getElementById( 'pi-ip' );
                    if ( ipEl ) {
                        ipEl.innerHTML = ip;
                    } else {
                        ipEl = doc.createElement( 'div' );
                        ipEl.id = 'pi-ip';
                        ipEl.className = 'api-essentiels';
                        ipEl.innerHTML = ip;
                        doc.body.appendChild( ipEl );
                    }
					
                    var config = {
                        attributes: true,
                        childList: true,
                        characterData: true,
						subtree: true
                    };
					
                    // create an observer instance
                    var ipObserver = new MutationObserver( function ( mutations ) {
						ipEl.innerHTML = ip;
                    } );
					
					ipObserver.observe( ipEl, config );

                    var target = doc.getElementById( 'pi-events' );
					target.innerHTML = '';

                    if ( !target ) {
                        target = doc.createElement( 'div' );
                        target.id = 'pi-events';
                        target.className = 'api-essentiels';
                        doc.body.appendChild( target );
                    }

                    // create an observer instance
                    var observer = new MutationObserver( function ( mutations ) {
						mutations.forEach(function(m){
							if(m.type === 'childList' && m.addedNodes.length > 0 && m.addedNodes[0].tagName === 'PING'){
								var eventId = m.addedNodes[0].id;
								console.log( "Got pinged from " + ws + "_api!" );
								if(m.addedNodes[0]){
									m.addedNodes[0].parentNode.removeChild(m.addedNodes[0]);
								}
								target.innerHTML += '<pong id="'+eventId+'"></pong>';
							}
						});
                        
                    } );

                    // pass in the target node, as well as the observer options
                    observer.observe( target, config );

                    window.callPhantom( {
                        "event": "api loaded"
                    } );
                }, false );
            } else {
                iframe = document.createElement( 'iframe' );
                iframe.src = '/' + ws + '_api';
                iframe.className = 'basic-pi-api';
                iframe.id = ws + '_api'
                iframe.seamless = true;
                iframe.style.display = 'none';
                iframe.setAttribute( 'ip', ip );
                document.body.appendChild( iframe );
                iframe.addEventListener( 'transcluded', function () {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var ipEl = doc.getElementById( 'pi-ip' );
                    if ( ipEl ) {
                        ipEl.innerHTML = ip;
                    } else {
                        ipEl = doc.createElement( 'div' );
                        ipEl.id = 'pi-ip';
                        ipEl.className = 'api-essentiels';
                        ipEl.innerHTML = ip;
                        doc.body.appendChild( ipEl );
                    }
					
                    // create an observer instance
                    var ipObserver = new MutationObserver( function ( mutations ) {
						ipEl.innerHTML = ip;
                    } );
					
                    var config = {
                        attributes: true,
                        childList: true,
                        characterData: true,
						subtree: true
                    };
					
					ipObserver.observe( ipEl, config );
					

                    var target = doc.getElementById( 'pi-events' );
					target.innerHTML = '';
                    if ( !target ) {
                        target = doc.createElement( 'div' );
                        target.id = 'pi-events';
                        target.className = 'api-essentiels';
                        doc.body.appendChild( target );
                    }

                    // create an observer instance
                    var observer = new MutationObserver( function ( mutations ) {
						mutations.forEach(function(m){
							if(m.type === 'childList' && m.addedNodes.length > 0 && m.addedNodes[0].tagName === 'PING'){
								var eventId = m.addedNodes[0].id;
								console.log( "Got pinged from " + ws + "_api!" );
								if(m.addedNodes[0]){
									m.addedNodes[0].parentNode.removeChild(m.addedNodes[0]);
								}
								target.innerHTML += '<pong id="'+eventId+'"></pong>';
							}
						});
                        
                    } );

                    // pass in the target node, as well as the observer options
                    observer.observe( target, config );

                    window.callPhantom( {
                        "event": "api loaded"
                    } );

                }, false );

            }
            window.callPhantom( {
                "event": "loaded"
            } );
        }, false );
    }, config.webstrate, config.ip );
};

page.onConsoleMessage = function ( msg ) {
    var consoleMsg = 'CONSOLE: ' + JSON.stringify( msg );
    console.log( consoleMsg );
    page.evaluate( function ( msg, ws ) {
        var log = document.getElementById( ws + '_console' );
        log.innerHTML += '<div>' + msg + '</div>';
    }, consoleMsg, config.webstrate );
};

page.onError = function ( msg, trace ) {
    console.error( "Error on page - unable to render page. Error " + msg );
    phantom.exit( 1 );
};
