function setup(Plugin) {
  Plugin.Views.append('activityBar', 'ultimateBuddyListActivityBar');
}

UltimateIDE.Plugins.register({
  name: 'Buddy List',
  description: 'List of all the online users',
  setup: setup,
  where: 'Client'
});
