( function () {
    'use strict';
    module.exports = {
        "api": {
            "description": "Sending {request: api} will return a description of the API components.",
            "permissions": [ "local", "token", "all" ],
            "status": "experimental",
            "parameters": "none",
            "function": function ( request, connection ) {
                let response = [];

                for ( let a in api ) {
                    response.push( {
                        "API name": a,
                        "Description": api[ a ].description,
                        "Access": api[ a ].access,
                        "Status": api[ a ].status,
                        "Request parameters": api[ a ].parameters
                    } );
                }
                connection.sendUTF( JSON.stringify( response ) );
            }
        },
        "pi": {
            "description": "Sending {request: pi} will return information on the particular PI. This component can only be called on the same local network or with a valid token.",
            "access": [ "local", "token" ],
            "status": "under development",
            "parameters": "none",
            "function": function ( request, connection ) {

            }
        },
        "device": {
            "description": "Sending {request: device} will return information on a particular device - based on ip (or mac address as parameter. This component can only be called on the same local network.",
            "access": [ "local" ],
            "status": "under development",
            "parameters": "[MAC address]",
            "function": function ( request, connection ) {

            }
        },
        "token": {
            "description": "Sending {request: token} will return a token that allow some interaction with the PI from outside the current local area wifi network. Default token time is 4 hours. This component can only be called on the same local network.",
            "access": [ "local" ],
            "status": "under development",
            "parameters": undefined,
            "function": function ( request, connection ) {

            }
        },
        "devices": {
            "description": "Sending {request: devices} will return a list of the devices on the same network as the PI. This component can only be called on the same local network.",
            "access": [ "local" ],
            "status": "under development",
            "parameters": "none",
            "function": function ( request, connection ) {

            }
        },
        "command": {
            "description": "Sending {request: command} will evaluate a unix command in the PI shell via nodejs child_process spawn. This component can only be called on the same local network or with a valid token.",
            "access": [ "local", "token" ],
            "status": "under development",
            "parameters": "[command]",
            "function": function ( connection, request ) {}
        }
    };

}() );
