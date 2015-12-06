/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    module.exports = api();

    function api() {
        function getActiveDevices(ip, sendMessage ) {
            let device = require( './models/device.js' );
            device.getAllDevices( function ( devices ) {
                sendMessage( devices );
            } );
        }

        function getDevice(ip, sendMessage ) {
            let device = require( './models/device.js' );
            device.getDevice(ip, function ( d ) {
                if ( d ) {
                    sendMessage( d );
                } else {
                    sendMessage( {
                        "response": "Unable to find device!"
                    } );
                }
            } );
        }

        function getPI(ip, sendMessage ) {
            let pi = require( './models/pi.js' );
            pi.getPI( function ( piInfo ) {
                if ( piInfo ) {
                    sendMessage( piInfo );
                } else {
                    sendMessage( {
                        "response": "Unable to obtain PI info!"
                    } );
                }
            } );
        }

        function getToken(ip, sendMessage ) {
            let token = require( './models/token.js' );
            getDevice( function ( d ) {
                if ( d ) {
                    token.createToken( function ( token ) {
                        if ( token ) {
                            sendMessage( token );
                        } else {
                            sendMessage( {
                                "response": "Unable to generate token!"
                            } );
                        }
                    } );
                } else {
                    sendMessage( {
                        "response": "Unable to identifi device and therefor unable to generate token!"
                    } );
                }
            } );
        }

        function getAPI(ip, sendMessage ) {
            let msg = {
                "getAPI": {
                    "Returns": "This message. This is a description of the PI API. Access to the individual functions require either (a) the device is local and on the same local area network as the PI, (b) or has a valid token that enable encrypted requests via webstrate events, (c) global access via clear text requests via webstrate events",
                    "Access": [ "local", "token", "global" ]
                },
                "getDevice": {
                    "Returns": "A device object containing information on the particular device, if it is currently on the same local area network as the PI.",
                    "Access": [ "local" ]
                },
                "getActiveDevices": {
                    "Returns": "An array containing all the active devices on this local area network.",
                    "Access": [ "local" ]
                },
                "getPI": {
                    "Returns": "A PI object describing the Raspberry PI this server is running on.",
                    "Access": [ "local", "token", "global" ]
                },
                "getToken": {
                    "Returns": "Returns a token object containing a signature and publicKey for communicating with the raspberry pi via webstrate events. The signature is used as identifier and the publicKey is used to encrypt the request message before adding it to the RPI event queue.",
                    "Access": [ "local" ]
                },
            };
            sendMessage(msg);

        }

        return Object.freeze( {
            getActiveDevices,
            getDevice,
            getPI,
            getAPI
        } );
    }
}() );
