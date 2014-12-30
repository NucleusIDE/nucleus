/**
 * We consider file change events to be click events too.
 */

var EVENT_NAME  = "click",
    APP_NAME = 'nucleus',
    utils = NucleusEventManager.getUtils(APP_NAME);

NucleusFileEvent = function() {
  this.initialize = function() {
    this.reactiveComp = this.syncFileChangeEvent();
  };

  this.tearDown = function() {
    this.reactiveComp.stop();
  };

  this.syncFileChangeEvent = function() {
    return Deps.autorun(function(c) {
      var newFile = Session.get("nucleus_selected_file");

      if (NucleusEventManager.canEmitEvents) {
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
    NucleusEventManager.canEmitEvents = false;

    var newFile = event.value;
    Session.set("nucleus_selected_file", newFile);
  };

};
