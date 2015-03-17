/**
 * Plugin to allow access to nucleus-master-prompt to other plugins.
 * Plugins like fuzzy-find-file should be able to register with this plugin
 * to get called when user enter their keybinding. Input from the prompt is
 * given to registered plugin and it should return an array of output values
 */

MasterPrompt = function(NucleusClient) {
  this._registeredPlugins = [];
  this.promptIn = new ReactiveVar();
  this.promptOut = new ReactiveVar();
  this.showPrompt = new ReactiveVar();
  this.selectedPlugin = null; //input is sent to selectedPlugin and output is shown in prompt
};

MasterPrompt.prototype.registerPlugin = function(plugin) {
  /**
   * Register `plugin` to use MasterPrompt.
   * `plugin` must be an object with these two properties:
   * - kbd  * string representing the keybinding when prompt shall be called
   * - promptResults  * function accepting prompt input and returning array of outputs
   */
  if (!_.isString(plugin['kbd'] || !_.isFunction(plugin['promptResults']))) {
    throw new Meteor.Error('Plugin must have `kbd` (string) and `promptResults` (function) properties');
  }

  NucleusClient.kbd.add(plugin.kbd, function() {
    this.showPromptWith(plugin);
  }.bind(this));

  this._registeredPlugins.push(plugin);
};

MasterPrompt.prototype.showPromptWith = function(plugin) {
  this.selectedPlugin = plugin;
  this.showPrompt.set(true);
};

MasterPrompt.prototype.hidePrompt = function() {
  this.selectedPlugin = null;
  this.showPrompt.set(false);
};

MasterPrompt.prototype.exec = function(NucleusClient) {
  NucleusClient.MasterPrompt = this;
  var self = this;

  Tracker.autorun(function() {
    var input = self.promptIn.get();

    console.log(input);
  });
};
