var EVENT_NAME  = "form:submit";

var form_submit = {
    initialize: function () {
        var browserEvent = this.syncBrowserEvent();
        NucleusEventManager.addEvent(document.body, "submit", browserEvent);
        NucleusEventManager.addEvent(document.body, "reset", browserEvent);
    },
    tearDown: function () {
        var browserEvent = this.syncBrowserEvent();
        NucleusEventManager.removeEvent(document.body, "submit", browserEvent);
        NucleusEventManager.removeEvent(document.body, "reset", browserEvent);
    },

    syncBrowserEvent: function () {
        return function (event) {
            if (NucleusEventManager.canEmitEvents) {
                var elem = event.target || event.srcElement;
                var data = NucleusEventManager.utils.getElementData(elem);
                data.type = event.type;

                var ev = new NucleusEvent();
                ev.setName(EVENT_NAME);
                ev.setTarget(data);
                ev.broadcast();
            } else {
                NucleusEventManager.canEmitEvents = true;
            }
        };
    },
    handleEvent: function (event) {
        var data = JSON.parse(event.target);
        var elem = NucleusEventManager.utils.getSingleElement(data.tagName, data.index);
        NucleusEventManager.canEmitEvents = false;

        if (elem && data.type === "submit") {
            //we wrap elem as a jquery object becuase elem.submit() don't trigger any event handlers on submit added in meteor app and cause reload
            // but $(elem).submit() triggers event handlers correctly
            $(elem).submit();
        }
        if (elem && data.type === "reset") {
            elem.reset();
        }

        return false;
    }
};

NucleusEventManager.forms[EVENT_NAME] = form_submit;
NucleusEventManager[EVENT_NAME] = form_submit;
