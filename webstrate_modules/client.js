// Generated by CoffeeScript 1.10.0

/*
Copyright 2014 Clemens Nylandsted Klokmose, Aarhus University

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

(function() {
  $(document).ready((function(_this) {
    return function() {
      var doc, ready, sharejsDoc, ws, wshost;
      sharejsDoc = window.location.pathname.slice(1, +window.location.pathname.length + 1 || 9e9);
      document.title = "Webstrate - " + sharejsDoc;
      if (sharejsDoc.length === 0) {
        throw "Error: No document id provided";
      }
      wshost = 'ws://' + window.location.host + '/ws/';
      ws = new ReconnectingWebSocket(wshost);
      window._sjs = new sharejs.Connection(ws);
      doc = _sjs.get('webstrates', sharejsDoc);
      doc.subscribe();
      ready = false;
      setTimeout((function() {
        if (!ready) {
          return $('body').append("Permission denied.");
        }
      }), 500);
      return doc.whenReady(function() {
        $(document).empty();
        ready = true;
        return window.dom2shareInstance = new DOM2Share(doc, document, function() {
          var event;
          document.dispatchEvent(new CustomEvent("loaded"));
          parent.postMessage("loaded", '*');
          window.loaded = true;
          if (window.frameElement != null) {
            event = new CustomEvent("transcluded", {
              detail: {
                name: sharejsDoc
              },
              bubbles: true,
              cancelable: true
            });
            return window.frameElement.dispatchEvent(event);
          }
        });
      });
    };
  })(this));

}).call(this);
