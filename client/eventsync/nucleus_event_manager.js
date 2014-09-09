var EventManager = function() {
  this.canEmitEvents = true; //this flag is used to prevent event ping-pong and re-inserts

  this.isProcessingEvent= function() {
    return ! this.canEmitEvents;
  };

  this.handleEvent = function(event) {
    if (event.type === "forms") {
      this.forms(event.getAppName())[event.getName()].handleEvent(event);
    } else
      this[event.getName()](event.getAppName()).handleEvent(event);
  };

  this.getUtils = function(appName) {
    return appName === "app" ? this.appUtils : this.nucleusUtils;
  };

  this.initialize = function() {
    var user = NucleusUser.me(),
        syncing_app_events = user.syncing_app_events,
        syncing_nucleus_events = user.syncing_nucleus_events,
        $appWindow = NucleusClient.getWindow("app"),
        $nucleusWindow = NucleusClient.getWindow("nucleus");

    this.app_initalized = false;
    this.appUtils = new EventUtils($appWindow);
    var appClick = new Click("app"),
        appScroll = new Scroll("app"),
        appLocation = new LocationEvent("app"),
        appLogin = new LoginEvent("app"),
        appForms = new FormsEvent("app");

    this.nucleus_initalized = false;
    this.nucleusUtils = new EventUtils($nucleusWindow);
    var nucleusClick = new Click("nucleus"),
        nucleusScroll = new Scroll("scroll"),
        nucleusForms = new FormsEvent("nucleus");

    this.click = function(appName) {
      return appName === "app" ? appClick : nucleusClick;
    };
    this.scroll = function(appName) {
      return appName === "app" ? appScroll : nucleusScroll;
    };
    this.location = function(appName) {
      //we don't need location event in nucleus window for now. Making this function just to stay consistent.
      return appName === "app" ? appLocation : false;
    };
    this.login = function(appName) {
      //this of course must not be synced in nucleus. But let's stay consistent
      return appName === "app" ? appLogin : false;
    };
    this.forms = function(appName) {
      return appName === "app" ? appForms : nucleusForms;
    };

    //Sometimes it takes time for NucleusUser.me().syncing_*_events to come down the wire.
    //Let's run an interval to initialize the events properly when event manager is initalized
    var initInterval = Meteor.setInterval(function() {
      var user = NucleusUser.me();
      if (user.syncing_nucleus_events || user.syncing_app_events) {
        Meteor.clearInterval(initInterval);

        if(user.syncing_app_events && !this.app_initialized) {
          //if someone is already logged in before joining sync, let's log them out so their login state won't interfere with others
          // this is to bring everyone on same page.
          if($appWindow.Meteor.logout) $appWindow.Meteor.logout();

          this.click("app").initialize();
          this.scroll("app").initialize();
          this.location("app").initialize();
          this.login("app").initialize();
          this.forms("app").initialize();

          // this.forms.initialize();

          this.app_initialized = true;

          this.startRecievingEvents();
        }

        if(user.syncing_nucleus_events  && !this.nucleus_initalized) {
          this.click("nucleus").initialize();
          this.scroll("nucleus").initialize();
          this.forms("nucleus").initialize();

          this.nucleus_initialized = true;

          this.startRecievingEvents();
        }
      }
    }.bind(this));

  };

  this.tearDown = function() {
    // NucleusEventManager.click.tearDown();
    // NucleusEventManager.scroll.tearDown();
    // this.forms.tearDown();
    // this.location.tearDown();
    // this.login.tearDown();

    this.stopRecievingEvents = true;
  };

  this.getRecievers = function() {
    return NucleusUsers.find({recieve_events: true});
  };

  this.startRecievingEvents = function() {
    this.replayEventsSinceLastRouteChange();

    Deps.autorun(function(c) {
      var events = NucleusEvent.getNewEvents();
      if(this.stopRecievingEvents) c.stop();
      NucleusEventManager.playEvents(events);
    });
  };

  this.playEvents = function(events) {
    _.each(events, function(event) {
      if(!event) return;
      if(_.contains(event.getDoneUsers(), NucleusUser.me()._id)) return;

      event.markDoneForMe();
      NucleusEventManager.handleEvent(event);
    });
  };

  this.replayEventsSinceLastRouteChange = function() {
    var onlineUsers = NucleusEventManager.getRecievers().map(function(user) {
      return user._id;
    });
    onlineUsers = _.difference(onlineUsers, NucleusUser.me()._id);

    if(onlineUsers.length === 0) {return false;}

    // last go event created by any logged in nucleus user
    var lastGoEvent = NucleusEvents.find({name: "location", originator: {$in: onlineUsers}}, {sort: {triggered_at: -1}, limit: 1}).fetch()[0];

    if(lastGoEvent) {
      var followingEvents = NucleusEvents.find({triggered_at: {$gt: lastGoEvent.triggered_at}}).fetch();
    }

    var lastLoginEvent = NucleusEvents.find({name: "login", type: "login", originator: {$in: onlineUsers}}, {sort: {triggered_at: -1}, limit: 1}).fetch()[0];


    NucleusEventManager.playEvents([lastLoginEvent]);

    if(! lastGoEvent) return false;

    //FIXME: Find a reliable way to make sure last login event is played and user is logged in successfully before playing last route event
    Meteor.setTimeout(function() {
      //the template to which the go event goes need rendered before we can trigger events that follow.
      //otherwise it interfere and some of the following events get triggered on the page before go event
      //FIXME: Find a reliable way to call following events after the template to which go event takes is rendered
      NucleusEventManager.playEvents([lastGoEvent]);

      Meteor.setTimeout(function() {
        NucleusEventManager.playEvents(followingEvents);
      }, 300);
    }, 300);
  };
};


//copied from browser-event-sync. But, why chaching?
var _ElementCache = function () {
  var cache = {},
      guidCounter = 1,
      expando = "data" + (new Date).getTime();

  this.getData = function (elem) {
    var guid = elem[expando];
    if (!guid) {
      guid = elem[expando] = guidCounter++;
      cache[guid] = {};
    }
    return cache[guid];
  };

  this.removeData = function (elem) {
    var guid = elem[expando];
    if (!guid) return;
    delete cache[guid];
    try {
      delete elem[expando];
    }
    catch (e) {
      if (elem.removeAttribute) {
        elem.removeAttribute(expando);
      }
    }
  };
};

/**
 * Fix an event
 * @param event
 * @param appName
 * @returns {*}
 */
var _fixEvent = function (event, elem) {
  function returnTrue() {
    return true;
  }
  function returnFalse() {
    return false;
  }

  var $window = elem.ownerDocument ? elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow : elem;
  if (!event || !event.stopPropagation) {
    var old = event || $window.event;
    // Clone the old object so that we can modify the values
    event = {};
    for (var prop in old) {
      event[prop] = old[prop];
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || $window.document;
    }

    // Handle which other element the event is related to
    event.relatedTarget = event.fromElement === event.target ?
      event.toElement :
      event.fromElement;

    // Stop the default browser action
    event.preventDefault = function () {
      event.returnValue = false;
      event.isDefaultPrevented = returnTrue;
    };

    event.isDefaultPrevented = returnFalse;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      event.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      this.isImmediatePropagationStopped = returnTrue;
      this.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX != null) {
      var doc = document.documentElement, body = document.body;

      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button != null) {
      event.button = (event.button & 1 ? 0 :
                      (event.button & 4 ? 1 :
                       (event.button & 2 ? 2 : 0)));
    }
  }

  return event;
};

/**
 * @constructor
 */
var _EventManager = function (cache) {
  var nextGuid = 1;

  this.addEvent = function (elem, type, fn) {
    var data = cache.getData(elem);
    if (!data.handlers) data.handlers = {};

    if (!data.handlers[type])
      data.handlers[type] = [];

    if (!fn.guid) fn.guid = nextGuid++;

    data.handlers[type].push(fn);

    if (!data.dispatcher) {
      data.disabled = false;
      data.dispatcher = function (event) {

        if (data.disabled) return;
        event = _fixEvent(event, elem);

        var handlers = data.handlers[event.type];
        if (handlers) {
          for (var n = 0; n < handlers.length; n++) {
            handlers[n].call(elem, event);
          }
        }
      };
    }

    if (data.handlers[type].length == 1) {
      if (document.addEventListener) {
        elem.addEventListener(type, data.dispatcher, false);
      }
      else if (document.attachEvent) {
        elem.attachEvent("on" + type, data.dispatcher);
      }
    }

  };

  function tidyUp(elem, type) {

    function isEmpty(object) {
      for (var prop in object) {
        return false;
      }
      return true;
    }

    var data = cache.getData(elem);

    if (data.handlers[type].length === 0) {

      delete data.handlers[type];

      if (document.removeEventListener) {
        elem.removeEventListener(type, data.dispatcher, false);
      }
      else if (document.detachEvent) {
        elem.detachEvent("on" + type, data.dispatcher);
      }
    }

    if (isEmpty(data.handlers)) {
      delete data.handlers;
      delete data.dispatcher;
    }

    if (isEmpty(data)) {
      cache.removeData(elem);
    }
  }

  this.removeEvent = function (elem, type, fn) {

    var data = cache.getData(elem);

    if (!data.handlers) return;

    var removeType = function (t) {
      data.handlers[t] = [];
      tidyUp(elem, t);
    };

    if (!type) {
      for (var t in data.handlers) removeType(t);
      return;
    }

    var handlers = data.handlers[type];
    if (!handlers) return;

    if (!fn) {
      removeType(type);
      return;
    }

    if (fn.guid) {
      for (var n = 0; n < handlers.length; n++) {
        if (handlers[n].guid === fn.guid) {
          handlers.splice(n--, 1);
        }
      }
    }
    tidyUp(elem, type);

  };

  this.proxy = function (context, fn) {
    if (!fn.guid) {
      fn.guid = nextGuid++;
    }
    var ret = function () {
      return fn.apply(context, arguments);
    };
    ret.guid = fn.guid;
    return ret;
  };
};

NucleusEventManager = new EventManager();
NucleusEventManager.cache = new _ElementCache();
_.extend(NucleusEventManager, new _EventManager(NucleusEventManager.cache));
