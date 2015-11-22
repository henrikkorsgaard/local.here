(function(){
    'use strict'
    let exec = require('child_process').exec;
    let cmd = 'iw wlan0 interface add mon0 type monitor && ip link set mon0 up';
    exec(cmd, function(err, stdout, stderr){
        console.log(err);
        console.log(stdout);
        console.log(stderr);
    });
}());
