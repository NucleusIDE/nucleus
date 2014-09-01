"use strict";

var EVENT_NAME  = "input:text";
var $document = NucleusClient.getAppWindow().document;


var input_text = {
    initialize: function () {
        NucleusEventManager.addEvent($document.body, "keyup", this.syncBrowserEvent());
        // bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
    },

    syncBrowserEvent: function () {
        return function (event) {
            var elem = event.target || event.srcElement;

            if (NucleusEventManager.canEmitEvents) {
                if (elem.tagName === "INPUT" || elem.tagName === "TEXTAREA") {
                    var value = elem.value;

                    var ev = new NucleusEvent();
                    ev.setName(EVENT_NAME);
                    ev.setTarget(NucleusEventManager.utils.getElementData(elem));
                    ev.setValue(value);
                    ev.broadcast();
                }
            } else {
                NucleusEventManager.canEmitEvents = true;
            }
        };
    },

    handleEvent: function (event) {
        var data = event.getTarget();
        NucleusEventManager.canEmitEvents = false;

        var elem = NucleusEventManager.utils.getSingleElement(data.tagName, data.index);
        if (elem) {
            elem.value = event.value;
            return elem;
        }
        return false;
    }
};

NucleusEventManager.forms[EVENT_NAME] = input_text;
NucleusEventManager[EVENT_NAME] = input_text;
