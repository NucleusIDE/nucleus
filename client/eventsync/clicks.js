Click = function(doc) {
  this.$document = doc;
  this.EVENT_NAME  = "click";

  this.initialize = function () {
    NucleusEventManager.addEvent(this.$document.body, this.EVENT_NAME, this.syncBrowserEvent.bind(this));
  };

  this.tearDown = function() {
    NucleusEventManager.removeEvent(this.$document.body, this.EVENT_NAME, this.syncBrowserEvent.bind(this));
  };

  this.triggerClick = function (elem) {
    //let's use jquery to trigger the click instead of doing it ourselves. Jquery's click work well with Router.go()/MobiRouter.go()
    //calls. Other way of triggering click event cause a window reload which is certainly not what we want
    console.log("TRIGGERING CLICK ON", elem);
    $(elem).click();

    // var evObj;
    // if (this.$document.createEvent) {
    //     evObj = this.$document.createEvent("MouseEvents");
    //     evObj.initEvent("click", true, true);
    //     elem.dispatchEvent(evObj);
    // } else {
    //     if (this.$document.createEventObject) {
    //         evObj = this.$document.createEventObject();
    //         evObj.cancelBubble = true;
    //         elem.fireEvent("on" + "click", evObj);
    //     }
    // }
  };

  this.syncBrowserEvent = function (event) {
    var canEmit = NucleusEventManager.canEmitEvents;

    if (canEmit) {
      var user = NucleusUser.me();
      if(! user.isSyncingEvents(user.event_recieving_app)) return;

      var elem = event.target || event.srcElement;
      if (elem.type === "checkbox" || elem.type === "radio") {
        NucleusEventManager.utils.forceChange(elem);
        return;
      }
      //below line should put the event in mongodb
      var ev = new NucleusEvent();
      ev.setName(this.EVENT_NAME);
      ev.setTarget(NucleusEventManager.utils.getElementData(elem));
      console.log("EVENT NAME IS", this);
      console.log("SYNCING EVENT", ev);
      ev.broadcast();
    }
    else NucleusEventManager.canEmitEvents = true;
  };

  this.handleEvent = function (event) {
    NucleusEventManager.canEmitEvents = false;

    var target = event.getTarget();
    var elem = NucleusEventManager.utils.getSingleElement(target.tagName, target.index);
    if (elem) {
      this.triggerClick(elem);
    }
  };
};
