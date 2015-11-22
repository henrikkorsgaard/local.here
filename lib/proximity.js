/*global console, module*/
module.exports = function(){
    'use strict';
    let webstrate_hierarchy = {'root': 'proximity', 'children':[]};
    let name = 'proximity';
    let child_process;
    let onEvent;

    const READY = 'READY';
    const INIT_ERROR = 'INIT_ERROR';

    function init(){


        setTimeout(function(){
            onEvent(READY);
          }, 1000);
    }

    function close(){
        console.log("closing api");
    }

    function addEventListener(callback){
      onEvent = callback;
    }

    return Object.freeze({
        name,
        addEventListener,
        init,
        close
    });
};
