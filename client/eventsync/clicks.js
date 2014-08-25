//copied from browser sync
var EVENT_NAME  = "click",
    $document = NucleusClient.getAppWindow().document;

var click = {
    initialize: function () {
        console.log("ADDING CLIKS EVENT LISTERNER");
        NucleusEventManager.addEvent($document.body, EVENT_NAME, this.syncBrowserEvent());
        //        bs.socket.on(EVENT_NAME, this.handle(bs, eventManager));
    },
    tearDown: function() {
        console.log("REMOVING CLIKS EVENT LISTERNER");
        NucleusEventManager.removeEvent($document.body, EVENT_NAME, this.syncBrowserEvent());
    },
    triggerClick: function (elem) {
        var evObj;
        if (document.createEvent) {
            evObj = document.createEvent("MouseEvents");
            evObj.initEvent("click", true, true);
            elem.dispatchEvent(evObj);
        } else {
            if (document.createEventObject) {
                evObj = document.createEventObject();
                evObj.cancelBubble = true;
                elem.fireEvent("on" + "click", evObj);
            }
        }
    },
    syncBrowserEvent: function () {
        return function(event) {
            if(! NucleusUser.me().syncEvents()) return;

            if(! NucleusEventManager.utils.isOriginalEvent(event))
                return;

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
        };
    },
    handle: function (target, virtual) {
        console.log("TRIGGERING click on", target);
        var elem = NucleusEventManager.utils.getSingleElement(target.tagName, target.index);
        if (elem) {
            this.triggerClick(elem);
        }
    }
};

NucleusEventManager[EVENT_NAME] = click;
