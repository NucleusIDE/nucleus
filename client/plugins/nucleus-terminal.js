NucleusTerminal = function(NucleusClient) {
};

NucleusTerminal.prototype.show = function() {
  Meteor.call('nucleusIsTerminalConfigured', function(err, res) {
    if (err) {
      throw err;
    }
    Session.set('nucleus_terminal_ready', res);
  });

  var showTerminal = Session.get("nucleus_show_terminal") || false;
  Session.set("nucleus_show_terminal", !showTerminal);
};

NucleusTerminal.prototype.hide = function() {
  Session.set("nucleus_show_terminal", false);
};

NucleusTerminal.prototype.toggle = function() {
  var showing = Session.get("nucleus_show_terminal") || false;
  if (showing) this.hide();
  else this.show();
};

NucleusTerminal.prototype.exec = function(NucleusClient) {
  NucleusClient.Terminal = this;
};
