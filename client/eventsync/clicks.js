/**
 * # ClickEvent
 * Handle capturing, syncing and receiving click events.
 */
Click = function(appName) {
  var EVENT_NAME  = "click",
      APP_NAME = appName,
      $document = NucleusClient.getWindow(APP_NAME).document,
      utils = NucleusEventManager.getUtils(APP_NAME);

  /**
   * Add the click event listener to body of the window of given app
   */
  this.initialize = function () {
    NucleusEventManager.addEvent($document.body, EVENT_NAME, this.syncBrowserEvent());
  };

  this.tearDown = function() {
    NucleusEventManager.removeEvent($document.body, EVENT_NAME, this.syncBrowserEvent());
  };

  this.triggerClick = function (elem) {
    //Let's use jquery to trigger the click instead of doing it ourselves. Jquery's click work well with Router.go()/MobiRouter.go()
    //calls. Other way of triggering click event cause a window reload which is certainly not what we want
    $(elem).click();

    /* <!--
     var evObj;
     if ($document.createEvent) {
     evObj = $document.createEvent("MouseEvents");
     evObj.initEvent("click", true, true);
     elem.dispatchEvent(evObj);
     } else {
     if ($document.createEventObject) {
     evObj = $document.createEventObject();
     evObj.cancelBubble = true;
     elem.fireEvent("on" + "click", evObj);
     }
     }
     --> */
  };

  /**
   * Send event over the wire i.e save event in mango db
   */
  this.syncBrowserEvent = function() {
    return function (event) {
      var canEmit = NucleusEventManager.canEmitEvents;

      if (canEmit) {
        var elem = event.target || event.srcElement;
        if (elem.type === "checkbox" || elem.type === "radio") {
          utils.forceChange(elem);
          return;
        }
        //for nucleus app, we want to sync click events only if they are made in the jstree sidebar. So.
        if(APP_NAME==='nucleus' && ! /jstree/.test(elem.parentElement.classList.toString()))
            return;


        var ev = new NucleusEvent();
        ev.setName(EVENT_NAME);
        ev.setAppName(APP_NAME);
        ev.setTarget(utils.getElementData(elem));
        ev.broadcast();
      }
      else NucleusEventManager.canEmitEvents = true;
    };
  };

  /**
   * Handle the event that has been received over the wire.
   */
  this.handleEvent = function (event) {
    NucleusEventManager.canEmitEvents = false;

    var target = event.getTarget();
    var elem = utils.getSingleElement(target.tagName, target.index);
    if (elem) {
      this.triggerClick(elem);
    }
  };
};
