/**
 * # input:submit
 *
 * Handle capturing, syncing and receiving form submit events.
 */

FormSubmitEvent = function(appName) {
  var EVENT_NAME  = "input:submit",
      APP_NAME = appName,
      $document = NucleusClient.getWindow(APP_NAME).document,
      utils = NucleusEventManager.getUtils(APP_NAME);

  this.initialize = function () {
    var browserEvent = this.syncBrowserEvent();
    NucleusEventManager.addEvent($document.body, "submit", browserEvent);
    NucleusEventManager.addEvent($document.body, "reset", browserEvent);
  };

  this.tearDown = function () {
    var browserEvent = this.syncBrowserEvent();
    NucleusEventManager.removeEvent($document.body, "submit", browserEvent);
    NucleusEventManager.removeEvent($document.body, "reset", browserEvent);
  };

  this.syncBrowserEvent = function () {
    return function (event) {
      if (NucleusEventManager.canEmitEvents) {
        var elem = event.target || event.srcElement;
        var data = utils.getElementData(elem);
        data.type = event.type;

        var ev = new NucleusEvent();
        ev.setName(EVENT_NAME);
        ev.setAppName(APP_NAME);
        ev.type = 'forms';
        ev.setTarget(data);
        ev.broadcast();
      } else {
        NucleusEventManager.canEmitEvents = true;
      }
    };
  };

  this.handleEvent = function (event) {
    var data = JSON.parse(event.target);
    var elem = utils.getSingleElement(data.tagName, data.index);
    NucleusEventManager.canEmitEvents = false;

    if (elem && data.type === "submit") {
      //We wrap elem as a jquery object becuase elem.submit() don't trigger any event handlers on submit added in meteor app and cause reload
      // but $(elem).submit() triggers event handlers correctly
      $(elem).submit();
    }
    if (elem && data.type === "reset") {
      elem.reset();
    }

    return false;
  };
};
