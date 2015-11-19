'use strict';

process.title = 'rpi-webstrate-cmd';

let WebSocketServer = require('websocket').server,
    http = require('http'),
    spawn = require('child_process').spawn;

let server = http.createServer(function(req, res){});

server.listen(3030, function(){});

// create the server
let ws = new WebSocketServer({
    httpServer: server
});

ws.on('request', function(req) {
    let connection = req.accept(null, req.origin);
    connection.on('message', function(msg) {
        if (msg.type === 'utf8') {
          let response = {
              "pid": undefined,
              "stdout": undefined,
              "stderr": undefined,
              "pid_errors": undefined,
              "done":false
          };
          let cmdArray = msg.utf8Data.split(' ');
          let cmd = cmdArray[0];
          let args = cmdArray.splice(1, cmdArray.length);

          try {
            let child = spawn(cmd, args);

            response['pid'] = child.pid;

            //SETINTERVAL --- NEED TO CHECK IF THE PROCESS IS ALIVE, BUT NOT SENDING TO STDOUT (e.g. tshark without -l flag)

            child.stdout.on('data', function(data){
                let str = data.toString();
                let lines = str.split(/\r\n|\r|\n/g);
                let i, len = lines.length;
                for(i = 0; i < len; i += 1){
                  if(lines[i] !== ''){
                      response['stdout'] = lines[i];
                      connection.send(JSON.stringify(response));
                  }
                }
            });

            child.stderr.on('data', function(data){
              let str = data.toString();
              let lines = str.split(/\r\n|\r|\n/g);
              let i, len = lines.length;
              for(i = 0; i < len; i += 1){
                  if(lines[i] !== ''){
                    response['stderr'] = lines[i];
                    connection.send(JSON.stringify(response));
                  }
              }
            });

            child.on('error', function(err){
              console.log("child on error")
              response['pid_errors'] = err;
              connection.send(JSON.stringify(response));

                //linux error list:http://www-numi.fnal.gov/offline_software/srt_public_context/WebDocs/Errors/unix_system_errors.html
                //do linuxError[error] check
            });

            child.on('close', function(code){
              response['done'] = true;
              connection.send(JSON.stringify(response));
            });

          } catch (err) {
                console.log(err);
          }
        }
    });

    connection.on('error', function(err){
        console.log(error);
    });

    connection.on('close', function(code) {
        console.log(error);
    });
});
