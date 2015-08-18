/* global EventSync, ReactiveVar, UltimateIDE*/

var UltimateIDEEventSync = function(UltimateIDE) {
  this.Manager = EventSync;

  var self = this;
  Utils.when(function() {
    return !!UltimateIDEUser.me();
  }, function() {
    var userId = UltimateIDEUser.me()._id;
    EventSync.setOriginatorId(userId);
    UltimateIDE.getWindow('app').eval('    UltimateIDE.EventSync.Manager.setOriginatorId("' + userId  + '");');
  });

  this.UltimateIDE = UltimateIDE;
  this.isSyncingAppEvents = new ReactiveVar(false);
  this.addNucleusScrollEvent();
  this.addClickFilters();
};

UltimateIDEEventSync.prototype.addClickFilters = function() {
  this.Manager.addEventFilter('click', function(e) {
    var $target = $(e.target);
    if ($target.hasClass('sync-ultimate-events') || $target.hasClass('sync-app-events')) {
      return false;
    };
    return true;
  });
};

UltimateIDEEventSync.prototype.isSyncingEvents = function(appName) {
  if (appName === 'app') {
    return this.isSyncingAppEvents.get();
  } else {
    return this.UltimateIDE.EventSync.Manager.isSyncingEvents.get();
  }
};

UltimateIDEEventSync.prototype.toggleEventSync = function(appName) {
  appName = appName || "app";

  if(appName === 'app') {
    var window = this.UltimateIDE.getWindow('app');
    var enabled = this.isSyncingAppEvents.get();

    this.isSyncingAppEvents.set(! this.isSyncingAppEvents.get());

    if(enabled)
      window.eval('this.UltimateIDE.EventSync.Manager.stop()');
    else
      window.eval('this.UltimateIDE.EventSync.Manager.start()');
  } else {
    if (this.UltimateIDE.EventSync.Manager.isSyncingEvents.get())
      this.UltimateIDE.EventSync.Manager.stop();
    else
      this.UltimateIDE.EventSync.Manager.start();
  }

};

UltimateIDEEventSync.prototype.addNucleusScrollEvent = function() {
  if (! window.opener) {
    //should work in nucleus window opened by app window only
    return;
  }
  var self = this;
  var NucleusScrollEvent = function nucleus_scroll(EventManager) {
    var EVENT_NAME = "nucleus_scroll",
        $window = window,
        utils = EventSync.Utils,
        Editor = self.UltimateIDE.Editor,
        NucleusEvent = EventManager.Collection;

    this.$window = $window;
    this.name = EVENT_NAME;

    this.initialize = function () {
      Editor.addEvent("changeScrollTop", this.syncNucleusScroll);
      // Editor.addEvent("changeScrollLeft", this.syncNucleusScroll);
      return this;
    };

    this.tearDown = function () {
      //In case of nuclues, we set ace events instead of window events
      Editor.editor.session.off("changeScrollLeft", this.syncNucleusScroll);
      Editor.editor.session.off("changeScrollTop", this.syncNucleusScroll);

      Editor.removeEvent("changeScrollLeft", this.syncNucleusScroll);
      Editor.removeEvent("changeScrollTop", this.syncNucleusScroll);
    };

    var nucScrollSynced = false;
    this.syncNucleusScroll =  function () {
      var canEmit = EventSync.canEmitEvents.get();

      var syncEvent = function() {
        var ev = new NucleusEvent();
        ev.setName(EVENT_NAME);
        ev.type = "editorScroll";
        //In case of nucleus, we just sync scroll in the editor window with API provided by ace
        ev.position = {
          x: Editor.editor.session.getScrollLeft(),
          y: Editor.editor.session.getScrollTop()
        };

        ev.broadcast();
        nucScrollSynced = false;
      };

      if(canEmit) {
        if(! nucScrollSynced) {
          nucScrollSynced = true;
          utils.executeWhenStopRolling(
            Editor.editor.session, ['$scrollTop', '$scrollLeft'], syncEvent, 100
          );
        }
      } else
        EventSync.canEmitEvents.set(true);
    };

    this.handleEvent = function (data) {
      EventSync.canEmitEvents.set(false);

      if(data.type === "editorScroll") {
        //In case of nucleus, we just sync scroll in the editor window with API provided by ace
        Editor.editor.session.setScrollLeft(data.position.x);
        Editor.editor.session.setScrollTop(data.position.y);
        return;
      }
    };

    return this.initialize();
  };

  this.Manager.addExternalEvent(NucleusScrollEvent);
};

function setup(Plugin) {
  Plugin.Views.append('activityBar', 'ultimateEventSyncActivityBar');
  UltimateIDE.EventSync = new UltimateIDEEventSync(UltimateIDE);
}

UltimateIDE.Plugins.register({
  name: 'Event Sync',
  description: 'Sync events in app and ultimate IDE',
  setup: setup,
  where: 'Client'
});
