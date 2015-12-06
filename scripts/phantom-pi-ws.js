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
            function addConsole() {
                var log = document.getElementById( ws + '_console' );
                if ( log ) {
                    log.innerHTML = '';
                } else {
                    log = document.createElement( 'div' );
                    log.id = ws + '_console';
					document.body.appendChild(log);
                }
            }

            function addIframe() {
                var iframe = document.getElementById( ws + '_api' );

                if ( iframe ) {
                    iframe.setAttribute( 'ip', ip );
                } else {
                    iframe = document.createElement( 'iframe' );
                    iframe.src = '/' + ws + '_api';
                    iframe.className = 'pi-api-connector';
                    iframe.id = ws + '_api';
                    iframe.seamless = true;
                    iframe.setAttribute( 'ip', ip );
                    document.body.appendChild( iframe );
                }

                iframe.addEventListener( 'transcluded', function () {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var ipDiv = doc.getElementById( 'pi-ip' );
                    if ( ipDiv ) {
                        ipDiv.innerHTML = ip;
                    } else {
                        ipDiv = doc.createElement( 'div' );
                        ipDiv.id = 'pi-ip';
                        ipDiv.className = 'api-essential';
                        ipDiv.innerHTML = ip;
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
                            console.log( "Got pinged from " + ws + "_api!" );
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
			
			addConsole();
			addIframe();

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
