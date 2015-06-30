var Explorer = function() {};

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
