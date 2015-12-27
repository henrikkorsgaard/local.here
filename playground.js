'use strict'
let WebstrateAgent =  require('./modules/webstrateAgent/webstrateAgent.js');
let ApiServer =  require('./modules/apiServer/apiServer.js');


var config = {
  server: "http://webstrate.cs.au.dk",
  password: "strate",
  login: "web",
  webstrate: "PI_test",
  ip: "192.168.1.1",
  port:3333
};
let server = new ApiServer(config);
