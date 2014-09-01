//copied from browser sync
var EVENT_NAME  = "click",
    $document = NucleusClient.getAppWindow().document;

var click = {
    initialize: function () {
        NucleusEventManager.addEvent($document.body, EVENT_NAME, this.syncBrowserEvent());
        //        bs.socket.on(EVENT_NAME, this.handle(bs, eventManager));
    },
    tearDown: function() {
        NucleusEventManager.removeEvent($document.body, EVENT_NAME, this.syncBrowserEvent());
    },
    triggerClick: function (elem) {
        var evObj;
        if ($document.createEvent) {
            evObj = $document.createEvent("MouseEvents");
            evObj.initEvent("click", true, true);
            elem.dispatchEvent(evObj);
        } else {
            if ($document.createEventObject) {
                evObj = $document.createEventObject();
                evObj.cancelBubble = true;
                elem.fireEvent("on" + "click", evObj);
            }
        }
    },
    syncBrowserEvent: function () {
        return function(event) {
            var canEmit = NucleusEventManager.canEmitEvents;

            if (canEmit) {
                if(! NucleusUser.me().isSyncingEvents()) return;

                var elem = event.target || event.srcElement;
                if (elem.type === "checkbox" || elem.type === "radio") {
                    NucleusEventManager.utils.forceChange(elem);
                    return;
                }
                //below line should put the event in mongodb
                var ev = new NucleusEvent();
                ev.setName(EVENT_NAME);
                ev.setTarget(NucleusEventManager.utils.getElementData(elem));
                ev.broadcast();
            }
            NucleusEventManager.canEmitEvents = true;

        };
    },
    handleEvent: function (event) {
        NucleusEventManager.canEmitEvents = false;

        var target = event.getTarget();
        var elem = NucleusEventManager.utils.getSingleElement(target.tagName, target.index);
        if (elem) {
            this.triggerClick(elem);
        }
    }
};

NucleusEventManager[EVENT_NAME] = click;
