if (Meteor.isServer) return;

var rAppend = function(rVar, item) {
  rVar.set(rVar.get().concat(item));
};

var _Views = function() {
  this.activityBar = new ReactiveVar([]);
};

_Views.prototype.append = function(viewName, templateName) {
  if (!this[viewName]) {
    throw new Meteor.Error('Ultimate don\'t have ' + view + ' view');
  }

  rAppend(this[viewName], templateName);
};

PluginManager.Views = new _Views();
