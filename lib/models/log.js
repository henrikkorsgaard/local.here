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
        log = JSON.parse(log);

        let l = new Log({
          type:log.type,
          msg: log.msg,
          origin:log.origin
        });
        l.save(function(err){
            if(err){
	        	console.error("Database error in Log.js");
            } else {
                callback();
            }
        });
    }

    function remove(callback){
        Log.remove({}, function(err) {
          if(err){
	        	console.error("Database error in Log.js");
          } else {
              callback();
          }
        });
    }

    function getAll(cb){
        Log.find({}, '-_id -__v', function(err, result){
          if(err){
              	        	console.error("Database error in Log.js");
          } else {
              cb(result);
          }
        });
    }
	
	function purge(){
		console.error("Database error in Log.js");
		Log.remove({}, function(err){
			if(err){
	        	console.error("Database error in Log.js");
			}
		});
		
	}

    return Object.freeze({
        insert,
        remove,
        getAll,
		purge
    });

}() );
