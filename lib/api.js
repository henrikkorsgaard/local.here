( function () {
    'use strict';
    module.exports = {
        "pi": {
            "description": "Sending {request: pi} will return information on the particular PI. This component can only be called on the same local network or with a valid token.",
            "permissions": [ "local", "token" ],
            "status": "under development",
            "function": function ( request, connection, device ) {
				connection.send("pi");
            }
        },
        "device": {
            "description": "Sending {request: device} will return information on a particular device - based on ip (or mac address as parameter. This component can only be called on the same local network.",
            "permissions": [ "local" ],
            "status": "under development",
            "function": function ( request, connection, device  ) {
				connection.send("device");
            }
        },
        "token": {
            "description": "Sending {request: token} will return a token that allow some interaction with the PI from outside the current local area wifi network. Default token time is 4 hours. This component can only be called on the same local network.",
            "permissions": [ "local" ],
            "status": "under development",
            "function": function ( request, connection, device ) {
				connection.send("token");
            }
        },
        "devices": {
            "description": "Sending {request: devices} will return a list of the devices on the same network as the PI. This component can only be called on the same local network.",
            "permissions": [ "local", "token" ],
            "status": "under development",
            "function": function ( request, connection, device ) {
				connection.send("devices");
            }
        },
        "command": {
            "description": "Sending {request: command} will evaluate a unix command in the PI shell via nodejs child_process spawn. This component can only be called on the same local network or with a valid token.",
            "permissions": [ "local", "token" ],
            "status": "under development",
            "function": function (request, connection, device ) {
				connection.send("command");
				
            }
        }
    };

}() );
