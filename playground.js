'use strict'



let server = require('./lib/server.js');

server.on('change', function(e){
    console.log(e);
});

server.on('error', function(err){
    console.log(err);
});

server.listen(1337);
