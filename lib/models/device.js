/*global console, process, require, __filename, module*/
( function () {
    'use strict';
    let mongo = require( 'mongoose' );
    let logger = require( '../logger.js' );
    let deviceSchema = new mongo.Schema( {
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
        updatedAt: Date
    } );

    let deviceLogSchema = new mongo.Schema( {
        mac: String,
        signals: [ Number ],
        mac_resolved: String,
        user_agent: String,
        ip: String,
        name: String,
        createdAt: Date,
        removedAt: Date
    } );

    let DeviceLogModel = mongo.model( 'DeviceLog', deviceLogSchema );
    let DeviceModel = mongo.model( 'Device', deviceSchema );

    module.exports = device();

    function device() {
        function logDevice( d, remove ) {
            DeviceLogModel.find( {
                'mac': d.mac
            } ).exists( 'removedAt', false ).exec( function ( err, result ) {
                if ( err ) {
                    logger.log( err, "CRITICAL", __filename );
                }
                if ( remove ) {
                    for ( let i = 0; i < result.length; i += 1 ) {
                        result[ i ].removedAt = Date.now();
                        result[ i ].save();
                    }
                } else {
                    if ( result.length === 0 ) {
                        d.signals = [ d.signal ];
                        d.createdAt = Date.now();
                        let dlm = new DeviceLogModel( d );
                        dlm.save();
                    } else if ( result.length === 1 ) {
                        result[ 0 ].signals.push( d.signal );
                        result[ 0 ].save();
                    } else {
                        result[ 0 ].signals.push( d.signal );
                        result[ 0 ].save();
                        for ( let i = 1; i < result.length; i += 1 ) {
                            result[ i ].removedAt = Date.now();
                            result[ i ].save();
                        }
                    }
                }
            } );
        }

        function getDeviceHistory( mac, callback ) {
            DeviceLogModel.find( {
                'mac': mac
            }, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }
                callback(result);
            });
        }

        function getAllDeviceHistory( callback ) {
            DeviceLogModel.find( {}, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }
                callback(result);
            }  );
        }

        function upsertDevice( d ) {
            device.updatedAt = Date.now();
            DeviceModel.update( d.mac, d, {
                upsert: true
            }, function ( err ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }
                logDevice( d, false );
            } );
        }

        function getDevice( ip, callback ) {
            DeviceModel.findOne( {
                'ip': ip
            }, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }

                if ( result ) {
                    callback( result );
                } else {
                    callback( undefined ); //Replacing potential null with undefined
                }
            } );
        }

        function isDeviceOnLocalAreaNetwork( ip, user_agent, callback ) {
            DeviceModel.update( {
                'ip': ip
            }, {
                user_agent: user_agent
            }, function ( err, response ) {
                if ( err || response.n === 0 ) {
                    callback( false );
                } else if ( response.n === 1 ) {
                    callback( true );
                } else {
                    callback( false );
                }
            } );
        }

        function getAllDevices( callback ) {
            DeviceModel.find( {}, function ( err, result ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }
                callback(result);
            } );
        }

        function removeDevice( d ) {
            logDevice( d, true );
            DeviceModel.remove( {
                'mac': d.mac
            }, function ( err ) {
                if ( err ) {
                    logger.log( err, "FATAL", __filename );
                }
            } );
        }

        return Object.freeze( {
            upsertDevice,
            isDeviceOnLocalAreaNetwork,
            getDevice,
            getAllDevices,
            getAllDeviceHistory,
            getDeviceHistory,
            removeDevice
        } );
    }
}() );
