NucleusPluginManager = function() {
  this._corePlugins = [];
  this._registeredPlugins = [];
};

NucleusPluginManager.prototype.registerPlugin = function(plugin) {
  var pluginObj = plugin;

  if (_.isFunction(plugin)) {
    pluginObj = new plugin();
  }

  if (! _.isObject(pluginObj)) {
    throw new Meteor.Error('plugin must be an object or function.');
  }

  if (!pluginObj.hasOwnProperty('exec') || !_.isFunction(pluginObj.exec)) {
    throw new Meteor.Error('plugin must have `exec` function');
  }

  //Register a plugin only once.
  if (this._registeredPlugins.indexOf(plugin) < 0) {
    pluginObj.exec(NucleusClient);
    this._registeredPlugins.push(plugin);
  }
};
