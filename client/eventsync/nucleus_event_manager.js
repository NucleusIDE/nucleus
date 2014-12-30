/**
 * # NucleusEventManager
 *
 * Single point of interaction for event sync.
 */
var EventManager = function() {
  /**
   * This flag is used to prevent event ping-pong and re-inserts. When we recieve an event, we mark `NucleusEventManager.canEmitEvents` to false so that the client won't re-send received event.
   */
  this.canEmitEvents = true;

  this.isProcessingEvent= function() {
    return ! this.canEmitEvents;
  };

  /**
   * Simple proxy for handling all kind of events with same interface.
   */
  this.handleEvent = function(event) {
    /**
     * Form events are of many types (check forms). So we take special care of them
     */
    if (event.type === "forms") {
      this.forms(event.getAppName())[event.getName()].handleEvent(event);
    } else
      //this should produce something like `this.click("app").handleEvent(event)`
      this[event.getName()](event.getAppName()).handleEvent(event);
  };

  this.getUtils = function(appName) {
    return appName === "app" ? this.appUtils : this.nucleusUtils;
  };

  /**
   * This is a pretty fat initializing function. It does a lot of work since we have to sync events for both app and Nucleus windows.
   *
   * NucleusEventManager is initialized in `NucleusUser` model when user toggles the event sync
   */
  this.initialize = function() {
    var user = NucleusUser.me(),
        syncing_app_events = user.syncing_app_events,
        syncing_nucleus_events = user.syncing_nucleus_events,
        $appWindow = NucleusClient.getWindow("app"),
        $nucleusWindow = NucleusClient.getWindow("nucleus");

    this.app_initalized = false;
    this.appUtils = new EventUtils($appWindow);
    //All these events `Click`, `Scroll` etc are defined in their respective files in eventSync directory
    var appClick = new Click("app"),
        appScroll = new Scroll("app"),
        appLocation = new LocationEvent("app"),
        appLogin = new LoginEvent("app"),
        appForms = new FormsEvent("app");

    this.nucleus_initalized = false;
    this.nucleusUtils = new EventUtils($nucleusWindow);
    /**
     * We don't sync all events for Nucleus. Only following events are synced:
     * * click : so a users could follow each other about which files they open in sidebar
     * * scroll : scrolling in the nucleus editor
     * * forms : commit message form
     */
    var nucleusClick = new Click("nucleus"),
        nucleusScroll = new Scroll("nucleus"),
        nucleusForms = new FormsEvent("nucleus");

    /**
     * We create proxies for all events since there are two type of apps emitting same events. I thought it's a nice way of doing this. I still think so.
     */
    this.click = function(appName) {
      return appName === "app" ? appClick : nucleusClick;
    };
    this.scroll = function(appName) {
      return appName === "app" ? appScroll : nucleusScroll;
    };
    this.location = function(appName) {
      //We don't need location event in nucleus window for now. Making this function just to stay consistent.
      return appName === "app" ? appLocation : false;
    };
    this.login = function(appName) {
      //This of course must not be synced in nucleus. But let's stay consistent
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
          //If someone is already logged in before joining sync, let's log them out so their login state won't interfere with others.
          // This is to bring everyone on same page.
          if($appWindow.Meteor.logout) $appWindow.Meteor.logout();

          this.click("app").initialize();
          this.scroll("app").initialize();
          this.location("app").initialize();
          this.login("app").initialize();
          this.forms("app").initialize();

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
    var user = NucleusUser.me();

    if(window.name !== 'Nucleus') {
      this.click('app').tearDown();
      this.scroll('app').tearDown();
      this.forms('app').tearDown();
      this.location('app').tearDown();
      this.login('app').tearDown();
    }
    if(window.name === 'Nucleus') {
      console.log("Tearing down nucleus");
      this.click('nucleus').tearDown();
      this.scroll('nucleus').tearDown();
      this.forms('nucleus').tearDown();
    }

    this.stopRecievingEvents = true;
  };

  /**
   * Get all users which are syncing events i.e which are ready to receive events.
   */
  this.getRecievers = function() {
    return NucleusUsers.find({recieve_events: true});
  };

  /**
   * Sets up an autorun to start receiving events. It also keeps an eye if user want to stop receiving events and stop this autorun if so.
   */
  this.startRecievingEvents = function() {
    //Replay all events since latest route change.
    this.replayEventsSinceLastRouteChange();
    Deps.autorun(function(c) {
      //Get new events to be played.
      var events = NucleusEvent.getNewEvents();
      if(this.stopRecievingEvents) c.stop();
      //Play all new events.
      NucleusEventManager.playEvents(events);
    });
  };

  /**
   * Play an array of `events`. Because of the heavy-lifting done in `NucleusEventManager.initialize()`, all these methods are pretty thin and easy to read.
   */
  this.playEvents = function(events) {
    _.each(events, function(event) {
      if(!event) return;
      if(_.contains(event.getDoneUsers(), NucleusUser.me()._id)) return;

      event.markDoneForMe();
      NucleusEventManager.handleEvent(event);
    });
  };

  /**
   * Replay all events that happened after latest route change.
   */
  this.replayEventsSinceLastRouteChange = function() {
    var onlineUsers = NucleusEventManager.getRecievers().map(function(user) {
      return user._id;
    });
    onlineUsers = _.difference(onlineUsers, NucleusUser.me()._id);

    if(onlineUsers.length === 0) {return false;}

    // Get the last go event created by any logged in nucleus user.
    var lastGoEvent = NucleusEvents.find({name: "location", originator: {$in: onlineUsers}}, {sort: {triggered_at: -1}, limit: 1}).fetch()[0];

    if(lastGoEvent) {
      //Get all the events that happened after `go` event
      var followingEvents = NucleusEvents.find({triggered_at: {$gt: lastGoEvent.triggered_at}}).fetch();
    }

    //Get the last login event that happened.
    var lastLoginEvent = NucleusEvents.find({name: "login", type: "login", originator: {$in: onlineUsers}}, {sort: {triggered_at: -1}, limit: 1}).fetch()[0];

    //Log in every user who want to sync events. This is so that we won't attempt to route a user to a page which is not accessible because they're not logged in or are logged in as some other user type.
    NucleusEventManager.playEvents([lastLoginEvent]);

    if(! lastGoEvent) return false;

    //FIXME: Find a reliable way to make sure last login event is played and user is logged in successfully before playing last route event
    Meteor.setTimeout(function() {
      /* The template to which the go event goes must be rendered before we can trigger events that follow.
       * Otherwise it interfere and some of the following events get triggered on the page before go event.
       *
       * FIXME: Find a reliable way to call following events after the template to which go event takes is rendered
       */
      NucleusEventManager.playEvents([lastGoEvent]);

      Meteor.setTimeout(function() {
        NucleusEventManager.playEvents(followingEvents);
      }, 300);
    }, 300);
  };
};

///////////////////////
// START COPIED CODE //
///////////////////////

//Copied from browser-event-sync.
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
  /////////////////////
  // END COPIED CODE //
  /////////////////////
};


NucleusEventManager = new EventManager();
NucleusEventManager.cache = new _ElementCache();
_.extend(NucleusEventManager, new _EventManager(NucleusEventManager.cache));
