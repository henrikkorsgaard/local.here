( function () {

    function piAPI( iframe ) {
        var idoc = iframe.contentDocument || iframe.contentWindow.document;
        var ip = idoc.getElementById( 'pi-ip' );
        var eventQueue = idoc.getElementById( 'pi-events' );
        var activeEvents = [];
        var connection;

        var observer = new MutationObserver( function ( mutations ) {
            mutations.forEach( function ( m ) {
                if ( m.type === 'childList' && m.addedNodes.length > 0 && m.addedNodes[ 0 ].tagName === 'API' ) {
                    var eventId = m.addedNodes[ 0 ].id;
                    var el = idoc.getElementById( eventId );
                    var request = el.getElementsByTagName('REQUEST');
                    var token = el.getElementsByTagName('TOKEN');

                    el.parentNode.removeChild( el );
                }
            } );
        } );

        var config = {
            attributes: false,
            childList: true,
            characterData: true
        };

        observer.observe( eventQueue, config );

        window.WebSocket = window.WebSocket || window.MozWebSocket;

        reconnect();

        connection.onerror = function ( error ) {
            console.error(error);
        };

        connection.onopen = function () {
            console.log("Websocket connection open!");
        };

        connection.onclose = function ( code ) {
            console.log("Websocket connection closed [code: "+code+"]. Will attempt reconnect in 15 seconds!");
            setTimeout( function () {
                reconnect();
            }, 15000 );
        };

        function reconnect() {
            connection = new WebSocket( 'ws://' + ip + ':1337' );
        }

        function serverRequest(request){
            if(connection.readyState === 1){
              
            } else {
                setTimeout(function(){
                  if(connection.readyState === 1){

                  } else {
                      eventQueue.innerHTML += '<response id="'+request.id+'"><error>Unable to send request - connection unavailable!</error></response>'
                  }
                }, 5000);
            }
        }

        /*
         * Function for generating unique event ids
         */
        function guid() {
            function s4() {
                return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

        function isValidIpv4Addr( ip ) {
            return /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/.test( ip );
        }
    }

    document.addEventListener( 'loaded', function ( e ) {
        console.log( window.location );
        var path = window.location.pathname.replace( '/', '' );
        var iframe = document.getElementById( path + '_api' );
        iframe.addEventListener( 'transcluded', function () {
            piAPI( iframe );
        } );
    } );

}() );
