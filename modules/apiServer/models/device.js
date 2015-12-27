module.exports = ( function () {
    'use strict';
    let mongoose = require( 'mongoose' );
    let Schema = mongoose.Schema;
    let deviceSchema = new Schema( {
        mac: {
            type: String,
            required: true,
            unique: true
        },
        signal: Number,
        mac_resolved: String,
        user_agent: String,
        ip: String,
        name: String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
    } );

    let deviceLogSchema = new Schema( {
        mac: String,
        signals: [ Number ],
        mac_resolved: String,
        user_agent: String,
        ip: String,
        name: String,
        createdAt: Date,
        removedAt: Date
    } );


    let Device = mongoose.model( 'Device', deviceSchema );
    let DeviceLog = mongoose.model( 'DeviceLog', deviceLogSchema );

    function logDevice( device ) {
        DeviceLog.find( {
            'mac': device.mac
        } ).exists( 'removedAt', false ).exec( function ( err, result ) {
            if ( err ) {
                GLOBAL.LOGGER.log( err, "CRITICAL", __filename );
            }
            if ( result.length === 0 ) {

                device.signals = [];
                device.signals.push(device.signal);
                device.createdAt = Date.now();
                let deviceLog = new DeviceLog( device );
                deviceLog.save( function ( err ) {
                    if ( err ) {
                        GLOBAL.LOGGER.log( err, "CRITICAL", __filename );
                    }
                } );
            } else if ( result.length === 1 ) {
                result[ 0 ].signals.push( device.signal );
                result[ 0 ].save( function ( err ) {
                    if ( err ) {
                        GLOBAL.LOGGER.log( err, "CRITICAL", __filename );
                    }
                } );
            } else {
                GLOBAL.LOGGER.log( "Got an unexpected result from device log database.", "CRITICAL", __filename );
            }
        } );
    }

    function logDeviceRemove( deviceMac ) {
        DeviceLog.find( {
            'mac': deviceMac
        } ).exists( 'removedAt', false ).exec( function ( err, result ) {
            if ( err ) {
                GLOBAL.LOGGER.log( err, "CRITICAL", __filename );
            }
            for ( let i = 0; i < result.length; i += 1 ) {
                result[ i ].removedAt = Date.now();
                saveIt( result[ i ] );
            }
        } );

        function saveIt( deviceLog ) {
            deviceLog.save( function ( err ) {
                if ( err ) {
                    GLOBAL.LOGGER.log( err, "CRITICAL", __filename );
                }
            } );
        }
    }

    function upsert( device, cb ) {
        device = JSON.parse( device );
        logDevice( device );
        Device.update( device.mac, device, {
            upsert: true
        }, function ( err ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error updating device database", "FATAL", __filename );
            } else {

                cb();
            }

        } );
    }

    function remove( mac, cb ) {
        logDeviceRemove( mac );
        Device.remove( {
            mac: mac
        }, function ( err ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error removing device from database", "FATAL", __filename );
            } else {
                cb();
            }
        } );
    }

    function getAll( cb ) {
        Device.find( {}, '-_id',  function ( err, result ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error getting devices from database", "FATAL", __filename );
            } else {
                cb( result );
            }
        } );
    }

    function getWithMac( mac, cb ) {
        Device.findOne( {
            mac: mac
        },'-_id', function ( err, device ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error getting devices from database", "FATAL", __filename );
            } else {
                cb( device );
            }
        } );
    }

    function getWithIP( ip, cb ) {
        Device.findOne( {
            ip: ip
        },'-_id',function ( err, device ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error getting devices from database", "FATAL", __filename );
            } else {
                cb( device );
            }
        } );
    }

    function getHistory(cb) {
        DeviceLog.find( {},'-_id -__v' , function ( err, result ) {
            if ( err ) {
                GLOBAL.LOGGER.log( "Error getting devices from database", "FATAL", __filename );
            } else {
                cb( result );
            }
        } );
    }

    return Object.freeze( {
        upsert,
        remove,
        getWithMac,
        getWithIP,
        getAll,
        getHistory
    } );

}() );
