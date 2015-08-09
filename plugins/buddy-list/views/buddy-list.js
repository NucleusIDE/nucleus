Template.ultimateBuddyListSidebar.helpers({
  userRows: function() {
    var rows = UltimateIDEUser.getOnlineUsers().map(function(user) {
      return {
        subcontentClasses: 'nucleus-tree-git-file-status buddy-list-item',
        status: ' ',
        statusStyles: 'background: ' + user.getColor(),
        label: user.username,
        labelSecondary: user.getCwd() ? user.getCwd().split('/').reverse().slice(0, 2).concat(['...']).reverse().join('/') : '',
        cwd: user.getCwd()
      };
    });

    return rows;
  }
});

Template.ultimateBuddyListSidebar.events({
  'click .buddy-list-item': function(e) {
    var cwd = this.cwd;
    Session.set('nucleus_selected_file', cwd);
  }
});
