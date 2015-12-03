'use strict'

let token = require( './lib/models/token.js' );
let device = require( './lib/models/device.js' );

let d = {
    mac: "c0:56:27:6d:3d:83",
    signal: undefined,
    mac_resolved: "Test device",
    ip: "192.168.1.101",
    name: "Test device"
};


//device.purge();

/*

let c = 0;

let timer = setInterval( function () {
    if ( c === 10 ) {
        device.removeDevice( d, function ( err, result ) {
            console.log( err );
            console.log( result );
        } );
    } else if ( c === 20 ) {
        device.removeDevice( d, function ( err, result ) {
            console.log( err );
            console.log( result );
        } );
    } else if ( c === 30 ) {
        device.removeDevice( d, function ( err, result ) {
            console.log( err );
            console.log( result );
        } );
    } else if ( c === 40 ) {
        device.removeDevice( d, function ( err, result ) {
            console.log( err );
            console.log( result );
        } );
    } else if (c === 50){

      clearTimeout(timer);
      process.exit();
    }
    d.signal = Math.floor( Math.random() * 100 );
    device.upsertDevice( d, function ( err, result ) {
        console.log( err );
        console.log( result );
    } );
    console.log( "ping" );
    c++;
}, 500 );

/*
token.createToken('192.168.1.123', 4, function(err, token){
    console.log(err);
    console.log(token);
});*/
/*
token.validateToken("rOKBcO5jfD6POB6JQNNZ+vBLehQCCnvfGw9IBYiV2fmoB6HmzHRg6CUo/nLrtVKkXqssAazvgxRwncRbah3QAeOTqtjZybhL7Jd4qn01S+9/QqyHyzrkXM2DryC7sc4i22mFS0fP/QqKuKzjIqshFR37Q1zWOn3TEuipZTag0sM=", function(err, valid){
    console.log(err);
    console.log(valid);
});
*/
/*
token.createToken("dhsakjdh", 3, function(err, result){


});
/*
let server = require('./lib/server.js');

server.on('change', function(e){
    console.log(e);
});

server.on('error', function(err){
    console.log(err);
});

server.listen(1337);
*/
