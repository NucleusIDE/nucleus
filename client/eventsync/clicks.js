Click = function(app) {
  var EVENT_NAME  = "click",
      APP_NAME = app,
      $document = NucleusClient.getWindow(this.APP).document,
      utils = NucleusEventManager.getUtils(APP_NAME);

  this.initialize = function () {
    console.log("Initializing CLICK for", APP_NAME);
    NucleusEventManager.addEvent($document.body, EVENT_NAME, this.syncBrowserEvent.bind(this));
  };

  this.tearDown = function() {
    NucleusEventManager.removeEvent($document.body, EVENT_NAME, this.syncBrowserEvent.bind(this));
  };

  this.triggerClick = function (elem) {
    //let's use jquery to trigger the click instead of doing it ourselves. Jquery's click work well with Router.go()/MobiRouter.go()
    //calls. Other way of triggering click event cause a window reload which is certainly not what we want
    if(elem.id !== "sync_nucleus_events")
      $(elem).click();

    // var evObj;
    // if ($document.createEvent) {
    //     evObj = $document.createEvent("MouseEvents");
    //     evObj.initEvent("click", true, true);
    //     elem.dispatchEvent(evObj);
    // } else {
    //     if ($document.createEventObject) {
    //         evObj = $document.createEventObject();
    //         evObj.cancelBubble = true;
    //         elem.fireEvent("on" + "click", evObj);
    //     }
    // }
  };

  this.syncBrowserEvent = function (event) {
    var canEmit = NucleusEventManager.canEmitEvents;

    if (canEmit) {
      var elem = event.target || event.srcElement;
      if (elem.type === "checkbox" || elem.type === "radio") {
        utils.forceChange(elem);
        return;
      }

      var ev = new NucleusEvent();
      ev.setName(EVENT_NAME);
      ev.setAppName(APP_NAME);
      ev.setTarget(utils.getElementData(elem));
      console.log("CLICKED IN APP", APP_NAME);
      console.log("GOING TO BROADCAST", ev);
      ev.broadcast();
    }
    else NucleusEventManager.canEmitEvents = true;
  };

  this.handleEvent = function (event) {
    NucleusEventManager.canEmitEvents = false;

    var target = event.getTarget();
    var elem = utils.getSingleElement(target.tagName, target.index);
    if (elem) {
      this.triggerClick(elem);
    } else console.log("ELEMENT CLICKED ON OTHER CLIENT NOT FOUND");
  };
};
