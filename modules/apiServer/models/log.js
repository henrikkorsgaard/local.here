module.exports = ( function () {
    'use strict';
    let mongoose = require( 'mongoose' );
    let Schema = mongoose.Schema;
    let logSchema = new Schema( {
        type:String,
        msg:String,
        origin:String,
        loggedAt: {type :Date, default: Date.now}
    } );

    let Log = mongoose.model('Log', logSchema);

    function insert(log, callback){
        let l = new Log({
          type:log.type,
          msg: log.msg,
          origin:log.origin
        });
        l.save(function(err){
            if(err){
                GLOBAL.LOGGER.log("Error saving log to database", "FATAL", __filename);
            } else {
                callback();
            }
        });
    }

    function remove(callback){
        Log.remove({}, function(err) {
          if(err){
              GLOBAL.LOGGER.log("Error removing logs from database", "FATAL", __filename);
          } else {
              callback();
          }
        });
    }

    function getAll(cb){
        Log.find({}, function(err, result){
          if(err){
              GLOBAL.LOGGER.log("Error getting devices from database", "FATAL", __filename);
          } else {
              cb(result);
          }
        });
    }

    return Object.freeze({
        insert,
        remove,
        getAll
    });

}() );
