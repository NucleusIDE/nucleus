var PluginManager_ = function() {
  this.plugins = [];
};

PluginManager_.prototype.register = function(plugin) {
  if (this.plugins[plugin.name]) {
    throw new Meteor.Error('Plugin ' + name + ' already registered');
  }

  this.plugins[plugin.name] = plugin;
  this._setupPlugin(plugin);
};

PluginManager_.prototype._setupPlugin = function(plugin) {
  var where = plugin.where;

  if (Meteor['is' + Utils.capitalizeFirstLetter(where)]) {
    plugin.setup(this);
  }
};

this.PluginManager = new PluginManager_();
