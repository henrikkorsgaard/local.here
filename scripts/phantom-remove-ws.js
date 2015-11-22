var page = require('webpage').create();
var system = require('system');
var args = system.args;

var config;
try {
    config = JSON.parse(args[1]);
} catch(e){
    console.error("INIT_ERROR");
    phantom.exit(1);
}

page.settings.userName = config.userName;
page.settings.password = config.password;

page.open(config.server + '/' + config.webstrate +, function(status) {
    if (status !== 'success') {
        console.error('WS_LOAD_ERROR', address);
        phantom.exit(1);
    }
});

page.onInitialized = function() {
    page.onCallback = function(data) {
        if (data.event === 'loaded') {
            console.log("WS_LOADED");
        } else if (data.event === 'transcluded') {
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

page.onError = function(msg, trace) {
    console.error(msg);
    /* FULL STACK TRACE CODE
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
        });
    }
    console.error(msgStack.join('\n'));
    */

    //DO NOT TERMINATE ON ERROR -- 'use strict' ERRORS SOMEWHERE IN STACK
    //phantom.exit(1);
};
