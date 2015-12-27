'use strict'
let call = "/devices/54:26:96:de:69:73"

let apiGetPatterns = {
  "^\/devices$": {description: "Get all the devices within proxomity of PI", fn:function(q,r){
  }},
  "(^\/devices\/)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$": {description: "Get device based on ip address", fn:function(q,r){
  }},
  "(^\/devices\/)((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}$": {description: "Get device based on mac address", fn:function(q,r){
  }},
  "^\/devices\/history$": {description: "Get scan history of on this PI", fn:function(q,r){
  }},
  "^\/token$": {description: "Get a token that allow off-site requests via webstrate", fn:function(q,r){
  }},
  "^\/\\w{3}$": {description: "Validate existing token", fn:function(q,r){
  }},
}

var re = /^(\/devices\/)((?:(\d{1,2}|[a-fA-F]{1,2}){2})(?::|-*)){6}$/

console.log(call.match(re))
/*
"^pattern$": {description: "what it does", fn:function(q,r){
    console.log("call name");
}}
*/

//HOW TO CALL AN API FUNCTION
/*
for (var obj in legalGetPatterns){
  let re = new RegExp(obj);
  if(call.match(re)){
    legalGetPatterns[obj].fn("a", "b");
  } else {

  }

}

*/
