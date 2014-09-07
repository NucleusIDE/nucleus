"use strict";

var EVENT_NAME  = "input:toggles",
    user = NucleusUser.me(),
    event_recieving_app = user ? user.event_recieving_app : "app",
    $document = NucleusClient.getWindow(event_recieving_app).document;


var toggles = {
  initialize: function () {
    var browserEvent = this.syncBrowserEvent();
    this.addEvents(NucleusEventManager, browserEvent);
  },
  tearDown: function() {
    var browserEvent = this.syncBrowserEvent();
    this.removeEvents(NucleusEventManager, browserEvent);
  },

  syncBrowserEvent: function () {
    return function (event) {

      if (NucleusEventManager.canEmitEvents) {
        var elem = event.target || event.srcElement;
        var data;
        if (elem.type === "radio" || elem.type === "checkbox" || elem.tagName === "SELECT") {
          var ev = new NucleusEvent();

          data = NucleusEventManager.utils.getElementData(elem);
          ev.setName(EVENT_NAME);
          data.type = elem.type;
          data.checked = elem.checked;
          ev.setTarget(data);
          ev.setValue(elem.value);
          ev.broadcast();
        }
      } else {
        NucleusEventManager.canEmitEvents = true;
      }

    };
  },
  handleEvent: function (event) {
    var data = JSON.parse(event.target);
    console.log("HANDLING EVENT DATA", data);
    NucleusEventManager.canEmitEvents = false;

    var elem = NucleusEventManager.utils.getSingleElement(data.tagName, data.index);

    if (elem) {
      if (data.type === "radio") {
        elem.checked = true;
      }
      if (data.type === "checkbox") {
        elem.checked = data.checked;
      }
      if (data.tagName === "SELECT") {
        elem.value = event.value;
      }
      return elem;
    }
    return false;
  },

  addEvents: function (eventManager, event) {

    var elems   = $document.getElementsByTagName("select");
    var inputs  = $document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
      for (var i = 0, n = domElems.length; i < n; i += 1) {
        eventManager.addEvent(domElems[i], "change", event);
      }
    }
  },
  removeEvents: function (eventManager, event) {

    var elems   = $document.getElementsByTagName("select");
    var inputs  = $document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
      for (var i = 0, n = domElems.length; i < n; i += 1) {
        eventManager.removeEvent(domElems[i], "change", event);
      }
    }
  }
};

NucleusEventManager.forms[EVENT_NAME] = toggles;
NucleusEventManager[EVENT_NAME] = toggles;
