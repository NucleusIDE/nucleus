var EVENT_NAME = 'location';
var $window = NucleusClient.getAppWindow();

var location = {
    initialize: function() {
        this.overRideGoCalls();
        NucleusEventManager.addEvent($window, 'popstate', this.syncGoPushstate());
    },
    tearDown: function() {
        this.undoGoCallOverRide();
        NucleusEventManager.removeEvent($window, 'popstate', this.syncGoPushstate());
    },
    overRideGoCalls: function() {
        if($window.Router) {
            $window.Router.originalGo = $window.Router.go;
            $window.Router.go = this.syncGoCall('Router');
        }
        if($window.MobiRouter) {
            $window.MobiRouter.originalGo = $window.MobiRouter.go;
            $window.MobiRouter.go = this.syncGoCall('MobiRouter');
        }
    },
    undoGoCallOverRide: function() {
        if($window.Router)
            $window.Router.go = $window.Router.originalGo;
        if($window.MobiRouter)
            $window.MobiRouter.go = $window.MobiRouter.originalGo;
    },
    syncGoCall: function(router) {
        return function() {
            var args = Array.prototype.slice.call(arguments, 0);
            var ret = $window[router].originalGo.apply($window[router], args);
            this.pushHistory();

            if (NucleusEventManager.canEmitEvents) {
                var ev = new NucleusEvent();

                ev.setName(EVENT_NAME);
                ev.router = router;
                ev.args = args;
                ev.broadcast();
            } else {
                NucleusEventManager.canEmitEvents = true;
            }

            return ret;
        }.bind(this);
    },

    history: ['/'],
    curIndex: 0,
    syncGoPushstate: function() {
        var loc = this;

        var movedDirection = function(list, url, cursor) {
            if(list[cursor + 1] === url) return 'forward';
            else return 'back';
        };

        return function() {
            if (NucleusEventManager.canEmitEvents) {
                var hist = loc.history,
                    cursor = loc.curIndex,
                    url = $window.location.pathname;

                var ev = new NucleusEvent();
                ev.setName(EVENT_NAME);
                ev.type = 'popstate';


                if(movedDirection(hist, url, cursor) === 'back') {
                    cursor = cursor - 1;
                    loc.curIndex = cursor;

                    ev.setValue('back');
                    ev.broadcast();
                    return;
                }
                else {
                    cursor = cursor + 1;
                    loc.curIndex = cursor;

                    ev.setValue('forward');
                    ev.broadcast();
                    return;
                }
            } else {
                NucleusEventManager.canEmitEvents = true;
            }
        };
    },
    pushHistory: function(item, cursor) {
        item = item || $window.location.pathname;
        cursor = cursor || this.curIndex;

        var len = this.history.length,
            maxLen = 20,
            history = this.history;

        if(cursor > maxLen) cursor = maxLen

        if(len < maxLen) {
            if(cursor !== len-1) {
                for (var j = 0; j > cursor && j < len; j++) {
                    history[j+1] = history[j];
                }
            }
            history[cursor+1] = item;
        } else{
            for(var i = 0; i < cursor; i++) {
                history[i] = history[i+1];
            }
            history[cursor] = item;
        }

        this.history = history;
        cursor += 1;
        this.curIndex = cursor;
    },
    handleEvent: function(event) {
        NucleusEventManager.canEmitEvents = false;

        if(event.type === 'popstate') {
            var action = event.value;
            console.log('GOING ',action);

            //let's not go back if user is on first page
            if (action === 'back' && $window.history.state.initial) {
                return;
            }
            $window.history[action]();
            return;
        }

        var router = event.router,
            args = event.args;

        return $window[router].go.apply($window[router], args);
    }
};

NucleusEventManager[EVENT_NAME] = location;
