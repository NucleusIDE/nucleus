InputToggleEvent = function(appName) {
  var EVENT_NAME  = "input:toggles",
      APP_NAME = appName,
      $document = NucleusClient.getWindow(APP_NAME).document,
      utils = NucleusEventManager.getUtils(APP_NAME);

  this.initialize = function () {
    var browserEvent = this.syncBrowserEvent();
    this.addEvents(NucleusEventManager, browserEvent);
  };

  this.tearDown = function() {
    var browserEvent = this.syncBrowserEvent();
    this.removeEvents(NucleusEventManager, browserEvent);
  };

  this.syncBrowserEvent = function () {
    return function (event) {

      if (NucleusEventManager.canEmitEvents) {
        var elem = event.target || event.srcElement;
        var data;
        if (elem.type === "radio" || elem.type === "checkbox" || elem.tagName === "SELECT") {
          var ev = new NucleusEvent();

          data = utils.getElementData(elem);
          ev.setName(EVENT_NAME);
          ev.setAppName(APP_NAME);
          ev.type = 'forms';
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
  };

  this.handleEvent = function (event) {
    var data = JSON.parse(event.target);
    console.log("HANDLING EVENT DATA", data);
    NucleusEventManager.canEmitEvents = false;

    var elem = utils.getSingleElement(data.tagName, data.index);

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
  };

  this.addEvents = function (eventManager, event) {

    var elems   = $document.getElementsByTagName("select");
    var inputs  = $document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
      for (var i = 0, n = domElems.length; i < n; i += 1) {
        eventManager.addEvent(domElems[i], "change", event);
      }
    }
  };

  this.removeEvents = function (eventManager, event) {
    var elems   = $document.getElementsByTagName("select");
    var inputs  = $document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
      for (var i = 0, n = domElems.length; i < n; i += 1) {
        eventManager.removeEvent(domElems[i], "change", event);
      }
    }
  };
};
