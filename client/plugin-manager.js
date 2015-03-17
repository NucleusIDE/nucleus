NucleusPluginManager = function(NucleusClient) {
  this.NucleusClient = NucleusClient;

  this._corePlugins = [
    Keybindings
  ];
  this._registeredPlugins = [];

  this._registerCorePlugins();
};

NucleusPluginManager.prototype.registerPlugin = function(plugin) {
  var pluginObj = plugin;

  if (typeof plugin == 'undefined') {
    console.log('Ignoring register undefined plugin');
    return;
  }

  if (_.isFunction(plugin)) {
    pluginObj = new plugin(this.NucleusClient);
  }

  if (! _.isObject(pluginObj)) {
    throw new Meteor.Error('plugin must be an object or function.');
  }

  if (!_.isFunction(pluginObj['exec'])) {
    throw new Meteor.Error('plugin must have `exec` function');
  }

  //Register a plugin only once.
  if (this._registeredPlugins.indexOf(plugin) < 0) {
    pluginObj.exec(this.NucleusClient);
    this._registeredPlugins.push(plugin);
  }
};

NucleusPluginManager.prototype._registerCorePlugins = function() {
  var self = this;
  this._corePlugins.forEach(function(plugin) {
    self.registerPlugin(plugin);
  });
};
