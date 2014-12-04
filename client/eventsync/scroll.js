/**
 * #ScrollEvent
 */

Scroll = function(appName) {
  var EVENT_NAME = "scroll",
      APP_NAME = appName,
      $window = NucleusClient.getWindow(APP_NAME),
      utils = NucleusEventManager.getUtils(APP_NAME);

  this.$window = $window;

  this.initialize = function () {
    NucleusEventManager.addEvent($window, EVENT_NAME, this.syncEvent);

    if (APP_NAME === 'nucleus') {
      //In case of nuclues, we set ace events instead of window events.
      //We need to use below api because events on ace are undone when document changes. NucleusEditor handles that
      NucleusEditor.addEvent("changeScrollTop", this.syncNucleusScroll);
      //      NucleusEditor.addEvent("changeScrollLeft", this.syncNucleusScroll);
    }
  };

  this.tearDown = function () {
    NucleusEventManager.removeEvent($window, EVENT_NAME, this.syncEvent);
    if (APP_NAME === 'nucleus') {
      //In case of nuclues, we set ace events instead of window events
      NucleusEditor.editor.session.off("changeScrollLeft", this.syncNucleusScroll);
      NucleusEditor.editor.session.off("changeScrollTop", this.syncNucleusScroll);

      NucleusEditor.removeEvent("changeScrollLeft", this.syncNucleusScroll);
      NucleusEditor.removeEvent("changeScrollTop", this.syncNucleusScroll);
    }
  };

  /**
   * Send events over the wire.
   */
  var appScrollSynced = false;
  this.syncEvent = function () {
    var canEmit = NucleusEventManager.canEmitEvents;
    var syncScroll = function() {
      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.setAppName(APP_NAME);
      ev.position = this.getScrollPosition();
      ev.broadcast();
      appScrollSynced = false;
    }.bind(this);

    if(canEmit) {
      if(! appScrollSynced) {
        var that = this;
        var roller = {
          y: that.getScrollPosition().raw.y,
          x: that.getScrollPosition().raw.x
        };
        NucleusEventManager.appUtils.executeWhenStopRolling(
          roller, ['x', 'y'], syncScroll, 1000
        );
        appScrollSynced = true;
      }
    } else
      NucleusEventManager.canEmitEvents = true;
  }.bind(this);

  /**
   * We have different scroll sync for nucleus than for the app. For nucleus, we scroll the nucleus editor, not the whole window because scrolling whole window won't scroll the nucleus editor. Scroll in nucleus editor is what we want in Nucleus
   */
  var nucScrollSynced = false; //we need to use this global to call the scroll change event once only. Without this, syncNucleusScroll gets called about 50 times per cm of scroll changed which spoils the performance
  this.syncNucleusScroll =  function () {
    var canEmit = NucleusEventManager.canEmitEvents;

    var syncEvent = function() {
      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.setAppName(APP_NAME);
      ev.type = "editorScroll";
      //In case of nucleus, we just sync scroll in the editor window with API provided by ace
      ev.position = {
        x: NucleusEditor.editor.session.getScrollLeft(),
        y: NucleusEditor.editor.session.getScrollTop()
      };

      ev.broadcast();
      nucScrollSynced = false;
    };

    if(canEmit) {
      if(! nucScrollSynced) {
        nucScrollSynced = true;
        NucleusEventManager.nucleusUtils.executeWhenStopRolling(
          NucleusEditor.editor.session, ['$scrollTop', '$scrollLeft'], syncEvent, 100
        );
      }
    } else
      NucleusEventManager.canEmitEvents = true;
  };

  this.handleEvent = function (data) {
    NucleusEventManager.canEmitEvents = false;

    if(data.getAppName() === "nucleus" && data.type === "editorScroll") {
      //In case of nucleus, we just sync scroll in the editor window with API provided by ace
      NucleusEditor.editor.session.setScrollLeft(data.position.x);
      NucleusEditor.editor.session.setScrollTop(data.position.y);
      return;
    }

    var scrollSpace = utils.getScrollSpace();
    //I couldn't understand the meaning of below lines for code from browser-sync
    // if (bs.opts && bs.opts.scrollProportionally) {
    return $window.scrollTo(0, scrollSpace.y * data.position.proportional); // % of y axis of scroll to px
    // } else {
    // return $window.scrollTo(0, data.position.raw);
    // }
  };

  this.getScrollPosition = function () {
    var pos = utils.getBrowserScrollPosition();
    return {
      raw: pos, // Get px of y axis of scroll
      proportional: this.getScrollTopPercentage(pos) // Get % of y axis of scroll
    };
  };

  this.getScrollPercentage = function (scrollSpace, scrollPosition) {
    var x = scrollPosition.x / scrollSpace.x;
    var y = scrollPosition.y / scrollSpace.y;

    return {
      x: x || 0,
      y: y
    };
  };

  this.getScrollTopPercentage = function (pos) {
    var scrollSpace = utils.getScrollSpace();
    var percentage  = this.getScrollPercentage(scrollSpace, pos);
    return percentage.y;
  };
};
