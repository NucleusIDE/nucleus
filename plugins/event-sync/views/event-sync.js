var state = new ReactiveDict();

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

Template.ultimateEventsFeed.helpers({
  eventFeed: function () {
    var feed = UltimateIDE.EventSync.Manager.Collection
          .find({}, {limit: 40, sort: {created_at: -1}})
          .map(function (event) {
            return {
              eventDoc: event,
              label: event.name,
              labelSecondary: UltimateIDEUser.findOne(event.originator_id).username,
              subcontentClasses: 'nucleus-tree-git-file-status event-feed-item',
            }
          });
    return feed;
  },
  selectedEvent: function () {
    var event = state.get('selectedEvent');
    if (!event) {
      return;
    }
    return JSON.stringify(event._originalDoc, null, 2);
  }
});

Template.ultimateEventsFeed.events({
  'click .nucleus-tree__row': function (e) {
    e.preventDefault();
    state.set('selectedEvent', this.eventDoc);
  }
});
