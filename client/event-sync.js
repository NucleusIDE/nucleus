NucleusEventSync = function(NucleusClient) {
  this.Manager = EventSync;
  this.isSyncingAppEvents = new ReactiveVar(false);
};

NucleusEventSync.prototype.isSyncingEvents = function(appName) {
  if (appName === 'app') {
    return this.isSyncingAppEvents.get();
  } else {
    return NucleusClient.EventSync.Manager.isSyncingEvents.get();
  }
};

NucleusEventSync.prototype.toggleEventSync = function(appName) {
  appName = appName || "app";

  if(appName === 'app') {
    var window = NucleusClient.getWindow('app');
    var enabled = this.isSyncingAppEvents.get();

    this.isSyncingAppEvents.set(! this.isSyncingAppEvents.get());

    if(enabled)
      window.eval('NucleusClient.EventSync.Manager.stop()');
    else
      window.eval('NucleusClient.EventSync.Manager.start()');
  } else {
    if (NucleusClient.EventSync.Manager.isSyncingEvents.get())
      NucleusClient.EventSync.Manager.stop();
    else
      NucleusClient.EventSync.Manager.start();
  }

};
