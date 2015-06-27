var Explorer = function() {
  this.workingFiles = new ReactiveVar([]);
};

Explorer.prototype.addWorkingFile = function(obj) {
  var workingFiles = this.workingFiles.get();

  var alreadyPresent = R.any(function(file) {
    return file.id === obj.id;
  }, workingFiles);

  if (alreadyPresent)
    return;

  workingFiles.push(obj);
  this.workingFiles.set(workingFiles);
};

Explorer.prototype.removeWorkingFile = function(obj) {
  var workingFiles = this.workingFiles.get('workingFiles');

  workingFiles = R.filter(function(file) {
    return file.id !== obj.id;
  }, workingFiles);

  this.workingFiles.set(workingFiles);
};

function setup(Plugin) {
  Plugin.Views.append('activityBar', 'ultimateExplorerActivitybar');

  /**
   * Set explore sidebar template to be the default sidebar template
   */
  Template.nucleusActivitybar.rendered = function() {
    Session.setDefault('activeSidebarTemplate', 'ultimateSidebarExplore');
  };

  UltimateIDE.Explorer = new Explorer();
}

UltimateIDE.Plugins.register({
  name: 'Explorer',
  description: 'Project file explorer with `Working Files` tray.',
  setup: setup,
  where: 'Client'
});
