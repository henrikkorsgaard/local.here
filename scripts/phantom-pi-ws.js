var page = require( 'webpage' ).create();
var system = require( 'system' );
var args = system.args;

var config;
try {
    config = JSON.parse( args[ 1 ] );
    console.log("Setting up webstrate "+config.webstrate_server+"/"+config.webstrate +" on phantomjs with the following PI ip: "+ config.ip );
} catch ( e ) {
    console.error('Unable to parse the config parameters from <'+args+'>');
    phantom.exit( 1 );
}
page.settings.userName = config.webstrate_login;
page.settings.password = config.webstrate_password;


page.open( config.webstrate_server + '/' + config.webstrate, function ( status ) {
    if ( status !== 'success' ) {
        console.error('Unable to connection to the webstrate server <'+config.webstrate_server+'>');
        phantom.exit( 1 );
    }
} );

page.onInitialized = function () {
    page.onCallback = function ( data ) {
        if ( data.event === 'loaded' ) {
            console.log( "Phantom loaded the "+config.webstrate+" webstrate on "+config.webstrate_server);
        } else if ( data.event === 'api loaded' ) {
            console.log( "Phantom loaded the webstrate api for /"+config.webstrate+" on /"+config.webstrate + "_api");
        }
    };

    page.evaluate( function (ws, ip) {
        document.addEventListener( 'loaded', function () {
            var iframe = document.getElementById( ws + '_api' );
            if ( iframe ) {
                iframe.setAttribute( 'ip', ip );
                iframe.addEventListener( 'transcluded', function () {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var ipEl = doc.getElementById('ip');
                    if(ipEl){
                      ipEl.innerHTML = ip;
                    } else {
                      ipEl = doc.createElement('div');
					  ipEl.id = 'ip';
                      ipEl.innerHTML = ip;
                      doc.body.appendChild(ipEl);
                    }
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
                var ipEl = doc.getElementById('ip');
                if(ipEl){
                  ipEl.innerHTML = ip;
                } else {
                  ipEl = doc.createElement('div');
                  ipEl.id = 'ip';
                  ipEl.innerHTML = ip;
                  doc.body.appendChild(ipEl);
                }
              }, false );
              window.callPhantom( {
                  "event": "api loaded"
              } );
            }
            window.callPhantom( {
                "event": "loaded"
            } );
        }, false );
    }, config.webstrate, config.ip);
};

page.onConsoleMessage = function ( msg, lineNum, sourceId ) {
    console.log( 'CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")' );
};

page.onError = function ( msg, trace ) {
    console.log(msg);
    console.log("Error on page - unable to render");
    phantom.exit(1);
};
