var page = require('webpage').create(),
    fs = require('fs'),
    system = require('system');

(function(){
    'use strict';

    if (system.args.length < 2) {
        console.log("Error: Need server configuration file (e.g.: phantom-ws.js config.conf)");
        phantom.exit(1);
    }

    var content = '',
        config = {},
        keyPair,
        i,
        len,
        file = null,
        lines = null,
        eol = system.os.name == 'windows' ? "\r\n" : "\n",
        webstrate_url;

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
        lines = content.split(eol);
        len = lines.length;
        for (i = 0; i < len; i++) {
            keyPair = lines[i].split('=');
            config[keyPair[0]] = keyPair[1];
        }
    } else {
        console.log("ERROR: Cannot read configuration file!");
        phantom.exit(1);
    }

    page.settings.userName = config.login;
    page.settings.password = config.password;
    webstrate_url = config.server + '/' + config.webstrate_name;

    page.open(webstrate_url, function(status) {
        if (status !== 'success') {
            console.log('ERROR: Unable to load', address);
            phantom.exit(1);
        }
    });

    page.onInitialized = function() {
        page.onCallback = function(data) {
            if (data.event === 'loaded') {
                console.log("webstrate loaded");
            } else if (data.event === 'transcluded') {
                console.log("transcluded webstrate loaded");
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
        console.log(error);
        phantom.exit(1);
    };
    
})();
