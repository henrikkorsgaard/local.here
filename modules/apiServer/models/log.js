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
                GLOBAL.Logger.log("Error saving log to database", "FATAL", __filename);
            } else {
                callback();
            }
        });
    }

    function remove(callback){
        Log.remove({}, function(err) {
          if(err){
              GLOBAL.Logger.log("Error removing logs from database", "FATAL", __filename);
          } else {
              callback();
          }
        });
    }

    return Object.freeze({
        insert,
        remove
    });

}() );
