/*global console, module*/
module.exports = function(){
    'use strict';
    let webstrate_hierarchy = {'root': 'cmd', 'children':[{'child':'cmd_events'}]};
    let name = 'cmd';
    let port;
    let child_process;
    let onEvent;

    const READY = 'READY';
    const INIT_ERROR = 'INIT_ERROR';

    function init(){
      setTimeout(function(){
          onEvent(READY);
      }, 3000);
    }

    function close(){
        console.log("closing api");
    }

    function setPort(port){
        port = port;
    }

    function addEventListener(callback){
      onEvent = callback;
    }

    return Object.freeze({
        name,
        port,
        setPort,
        addEventListener,
        init,
        close
    });
};
