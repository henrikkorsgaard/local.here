(function(){
    'use strict'
    let http = require('http');
    http.createServer(function (req, res) {
        res.end('It Works!! Path Hit: ' + req.url);
    }).listen(1337);
}());
