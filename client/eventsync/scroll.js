var EVENT_NAME = "scroll";
var utils = NucleusEventManager.utils;
var $window = NucleusClient.getAppWindow();

var scroll = {
    //this is used to avoid infinite ping-pong of events. We set it to false when we receive an event over the wire, and check while syncing the event.
    // If it's false in syncEvent function, it means the event was triggered from within 'handle' function and we don't need to sync it. So we set it to
    // true so the events start getting synced again
    initialize: function () {
        NucleusEventManager.addEvent($window, EVENT_NAME, this.syncEvent());
        // bs.socket.on(EVENT_NAME, exports.socketEvent());
    },
    tearDown: function () {
        NucleusEventManager.removeEvent($window, EVENT_NAME, this.syncEvent());
        // bs.socket.on(EVENT_NAME, exports.socketEvent());
    },
    syncEvent: function (bs) {
        return function () {
            var canEmit = NucleusEventManager.canEmitEvents;

            if(canEmit) {
                if(! NucleusUser.me().isSyncingEvents()) return;

                var ev = new NucleusEvent();
                ev.setName(EVENT_NAME);
                ev.position = this.getScrollPosition();
                //we use broadcast instead of save() to do some preprocessing. We could override model.save() but apparently we need to
                // do some re-factoring in StupidModel. They set the methods provided by Model.extend() higher up the prototype chain
                ev.broadcast();
            }

            NucleusEventManager.canEmitEvents = true;
        }.bind(this);
    },

    handleEvent: function (data) {
        NucleusEventManager.canEmitEvents = false;

        var scrollSpace = utils.getScrollSpace();
        //I couldn't understand the meaning of below lines for code from browser-sync
        // if (bs.opts && bs.opts.scrollProportionally) {
            return $window.scrollTo(0, scrollSpace.y * data.position.proportional); // % of y axis of scroll to px
        // } else {
        // return $window.scrollTo(0, data.position.raw);
        // }
    },

    getScrollPosition: function () {
        var pos = utils.getBrowserScrollPosition();
        return {
            raw: pos, // Get px of y axis of scroll
            proportional: this.getScrollTopPercentage(pos) // Get % of y axis of scroll
        };
    },

    getScrollPercentage: function (scrollSpace, scrollPosition) {
        var x = scrollPosition.x / scrollSpace.x;
        var y = scrollPosition.y / scrollSpace.y;

        return {
            x: x || 0,
            y: y
        };
    },

    getScrollTopPercentage: function (pos) {
        var scrollSpace = utils.getScrollSpace();
        var percentage  = this.getScrollPercentage(scrollSpace, pos);
        return percentage.y;
    }
};

NucleusEventManager[EVENT_NAME] = scroll;
