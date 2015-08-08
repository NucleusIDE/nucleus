Template.ultimateSidebarEventSync.helpers({
  syncIcon: function(app) {
    return UltimateIDE.EventSync.isSyncingEvents(app) ? 'fa-chain' : 'fa-chain-broken';
  }
});

Template.ultimateSidebarEventSync.events({
  'click .sync-app-events': function() {
    UltimateIDE.EventSync.toggleEventSync('app');
  },
  'click .sync-ultimate-events': function() {
    UltimateIDE.EventSync.toggleEventSync('ultimate');
  }
});
