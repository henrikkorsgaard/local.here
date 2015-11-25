/*global console, module*/
module.exports = function () {
    'use strict';

    //Private stuff
    let eventHandlers = {'ready':[], 'error':[],'terminated':[]};

    function broadcastEvent( event ) {
        let i, len = eventHandlers[event.type].length;
        for ( i = 0; i < len; i += 1 ) {
            eventHandlers[event.type][i]( event );
        }
    }

    //SETUP

    //PUBLIC
    let name = 'server';

    function start() {
    }

    function stop() {
        //DO SOMETHING WILL YOU!
    }

    function on(event, callback){
        eventHandlers[event].push(callback);
    }

    return Object.freeze( {
        name,
        start,
        stop,
        on
    } );
};
