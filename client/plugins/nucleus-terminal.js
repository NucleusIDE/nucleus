NucleusTerminal = function(NucleusClient) {
  // this.showingTerminal = new ReactiveVar(true);
};

NucleusTerminal.prototype.show = function() {
  var self = this;
  Meteor.call('nucleusIsTerminalConfigured', function(err, res) {
    if (err) {
      throw err;
    }
    Session.set('nucleus_terminal_ready', true);
    // self.showingTerminal.set(res);
  });

  // var showTerminal = this.showingTerminal.get();
  // this.showingTerminal.set(!showTerminal);
  var showTerminal = Session.get('nucleus_show_terminal');
  Session.set('nucleus_show_terminal', !showTerminal);
};

NucleusTerminal.prototype.hide = function() {
  // this.showingTerminal.set(false);
  Session.set('nucleus_show_terminal', false);
};

NucleusTerminal.prototype.toggle = function() {
  // var showing = this.showingTerminal.get();
  var showing = Session.get('nucleus_show_terminal');
  if (showing) this.hide();
  else this.show();
};

NucleusTerminal.prototype.exec = function(NucleusClient) {
  NucleusClient.Terminal = this;
};
