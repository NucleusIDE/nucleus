/**
 * We consider file change events to be click events too.
 */

var EVENT_NAME  = "click",
    APP_NAME = 'nucleus',
    utils = NucleusEventManager.getUtils(APP_NAME);

NucleusFileEvent = function() {
  this.initialize = function() {
    this.reactiveComp = this.syncFileChangeEvent();
    console.log("INITIALIZING FILE CHANGE EVENT", this.reactiveComp);
  };

  this.tearDown = function() {
    this.reactiveComp.stop();
    console.log("TEARING DOWN FILE CHANGE EVENT");
  };

  this.syncFileChangeEvent = function() {
    return Deps.autorun(function(c) {
      var newFile = Session.get("nucleus_selected_file");

      if (NucleusEventManager.canEmitEvents) {
        console.log("TRIGGERING FILE CHANGE EVENT");
        Deps.nonreactive(function() {
          var ev = new NucleusEvent();
          ev.setName(EVENT_NAME);
          ev.setAppName(APP_NAME);
          ev.setValue(newFile);
          ev.broadcast();
        });
      }
      else NucleusEventManager.canEmitEvents = true;
    });
  };

  this.handleEvent = function (event) {
    console.log("HANDLING FILE CHANGE EVENT");

    NucleusEventManager.canEmitEvents = false;

    var newFile = event.value;
    Session.set("nucleus_selected_file", newFile);
    console.log("NEW FILE IS ", newFile);
  };

};
