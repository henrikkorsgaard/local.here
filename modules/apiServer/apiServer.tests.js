'use strict';
let assert = require( 'assert' );
let ApiServer = require( './apiServer.js' );
let request = require( 'request' );
let crypto = require( 'crypto' );
let algorithm = 'aes-256-ctr';
let server;
let token;
let publicKey;
let invalidToken = "12345678910111213141516171819202";
let ip = '192.168.1.101';
let device = {
    mac: "54:26:96:de:69:73",
    signal: 55,
    mac_resolved: "Test device",
    user_agent: "Henrik Korsgaard",
    ip: ip,
    name: "test device"
}

let log = {
    type: "LOG",
    msg: "Test log",
    origin: __filename
}

let pi = {
    mac: "54:26:96:de:69:73",
    ip: '192.168.1.123',
    stationMac: "TEST",
    stationIP: "TEST",
    SSID: "TEST",
    os: "TEST",
    cpu: "TEST",
    peripherals: [ "TEST" ],
}

describe( 'Testing internal API functionalities', function () {
    before( function () {
        server = new ApiServer( {
            port: 3333,
            ip: "192.168.1.1"
        } );
    } );

    describe( 'Device API', function () {
        it( 'PUT device', function ( done ) {

            var options = {
                url: 'http://localhost:3333/devices',
                body: device,
                json: true,
                method: 'put'
            };
            request( options, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                assert.equal( body.status, 'ok' );
                done();
            } );
        } );

        it( 'DELETE device', function ( done ) {
            request.del( 'http://localhost:3333/devices/' + device.mac, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                done();
            } );
        } );

        it( 'PUT device again because I need it later', function ( done ) {

            var options = {
                url: 'http://localhost:3333/devices',
                body: device,
                json: true,
                method: 'put'
            };
            request( options, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                assert.equal( body.status, 'ok' );
                done();
            } );
        } );

    } );

    describe( 'LOG API', function () {

        it( 'DELETE logs', function ( done ) {
            request.del( 'http://localhost:3333/logs', function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                done();
            } );
        } );

        it( 'PUT log', function ( done ) {
            var options = {
                url: 'http://localhost:3333/logs',
                body: log,
                json: true,
                method: 'put'
            };
            request( options, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                assert.equal( body.status, 'ok' );
                done();
            } );
        } );

    } );

    describe( 'PI API', function () {

        it( 'PUT PI', function ( done ) {
            var options = {
                url: 'http://localhost:3333/pi',
                body: pi,
                json: true,
                method: 'put'
            };
            request( options, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                assert.equal( body.status, 'ok' );
                done();
            } );
        } );

    } );

    after( function () {
        server.stop();
    } );
} );

describe( 'Testing external API functionalities', function () {
    before( function () {
        server = new ApiServer( {
            port: 3333,
            ip: "192.168.1.1"
        } );
    } );

    describe( 'Token API', function () {
        it( 'GET token', function ( done ) {
            request.get( 'http://' + ip + ':3333/token', function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.token.length, 32 );
                token = json.token;
                publicKey = json.publicKey;
                done();
            } );
        } );

        it( 'Validate token', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + token, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.token, 'valid' );
                done();
            } );
        } );

        it( 'Invalid token', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + invalidToken, function ( err, res, body ) {
                assert.equal( res.statusCode, 418 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'error' );
                done();
            } );
        } );

    } );

    describe( 'Device API', function () {
        it( 'GET Devices', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + token + '/devices', function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.hasOwnProperty( 'devices' ), true );
                done();
            } );
        } );

        it( 'GET Device MAC', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + token + '/devices/' + device.mac, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.hasOwnProperty( 'device' ), true );
                done();
            } );
        } );

        it( 'GET Device IP', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + token + '/devices/' + device.ip, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.hasOwnProperty( 'device' ), true );
                done();
            } );
        } );

        it( 'GET Device history', function ( done ) {
            request.get( 'http://' + ip + ':3333/devices/history', function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.hasOwnProperty( 'devices' ), true );
                done();
            } );
        } );

    } );
    describe( 'Log API', function () {
        it( 'GET Logs', function ( done ) {
            request.get( 'http://' + ip + ':3333/'+ token +'/logs', function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.hasOwnProperty( 'logs' ), true );
                done();
            } );
        } );

    } );
    describe( 'PI API', function () {
        it( 'GET Pi', function ( done ) {
            request.get( 'http://' + ip + ':3333/pi', function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.hasOwnProperty( 'pi' ), true );
                done();
            } );
        } );

    } );

    after( function () {
        server.stop();
    } );
} );



describe( 'Testing PI only API functionalities', function () {
    before( function () {
        server = new ApiServer( {
            port: 3333,
            ip: ip
        } );
    } );

    describe( 'Token API', function () {
        it( 'Validate token', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + token, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                assert.equal( json.token, 'valid' );
                done();
            } );
        } );

        it( 'Invalid token', function ( done ) {
            request.get( 'http://' + ip + ':3333/' + invalidToken, function ( err, res, body ) {
                assert.equal( res.statusCode, 418 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'error' );
                done();
            } );
        } );
    } );

    describe( 'Encrypted Request API', function () {
        it( 'GET devices', function ( done ) {
            let encryptedRequest = encrypt( JSON.stringify( {
                api: 'devices'
            } ), publicKey );
            request.get( 'http://' + ip + ':3333/' + token + '/' + encryptedRequest, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                let decryptedBody = decrypt( json.encryptedResponse, publicKey );
                let decryptedJson = JSON.parse( decryptedBody );
                assert.equal( decryptedJson.hasOwnProperty('devices'), true );
                done();
            } );
        } );

        it( 'GET PI', function ( done ) {
            let encryptedRequest = encrypt( JSON.stringify( {
                api: 'pi'
            } ), publicKey );
            request.get( 'http://' + ip + ':3333/' + token + '/' + encryptedRequest, function ( err, res, body ) {
                assert.equal( res.statusCode, 200 );
                let json = JSON.parse( body );
                assert.equal( json.status, 'ok' );
                let decryptedBody = decrypt( json.encryptedResponse, publicKey );
                let decryptedJson = JSON.parse( decryptedBody );
                assert.equal( decryptedJson.hasOwnProperty('pi'), true );
                done();
            } );
        } );
    } );



    after( function () {
        server.stop();
    } );
} );

function encrypt( text, key ) {
    var cipher = crypto.createCipher( algorithm, key )
    var crypted = cipher.update( text, 'utf8', 'hex' )
    crypted += cipher.final( 'hex' );
    return crypted;
}

function decrypt( text, key ) {
    var decipher = crypto.createDecipher( algorithm, key )
    var dec = decipher.update( text, 'hex', 'utf8' )
    dec += decipher.final( 'utf8' );
    return dec;
}
