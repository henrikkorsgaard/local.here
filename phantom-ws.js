var page = require('webpage').create(),
    fs = require('fs'),
    system = require('system');

(function(){
    var content,
        file,
        config;
    if (system.args.length < 2) {
        console.log("Error: Need server configuration file (e.g.: phantom-ws.js config.conf)");
        phantom.exit(1);
    }

    try {
        file = fs.open(system.args[1], "r");
        content = file.read();
    } catch (e) {
        console.log(e);
        console.log("ERROR: Cannot read configuration file!");
        phantom.exit(1);
    }

    if (file) {
        file.close();
    }

    if (content) {
        config = JSON.parse(content);
    } else {
        console.log("ERROR: Cannot read configuration file!");
        phantom.exit(1);
    }

    page.settings.userName = config.login;
    page.settings.password = config.password;

    page.open(config.server + '/' + config.webstrate, function(status) {
        if (status !== 'success') {
            console.log('ERROR: Unable to load', address);
            phantom.exit(1);
        }
    });

    page.onInitialized = function() {
        page.onCallback = function(data) {
            if (data.event === 'loaded') {
            } else if (data.event === 'transcluded') {
            } else if (data.event === 'error'){
            }
        };

        page.evaluate(function() {
            document.addEventListener('loaded', function() {
                window.callPhantom({"event":"loaded"});
            }, false);
        });
        page.evaluate(function() {
            document.addEventListener('transcluded', function() {
                window.callPhantom({"event":"transcluded"});
            }, false);
        });
    };

    page.onError = function(error, trace) {
        //I need a general error handler -- on error, on exit, on termination of phantomjs process. !powershut!
        console.log(error);
        phantom.exit(1);
    };
})();
