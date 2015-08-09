var statusRows = [{
  subcontentClasses: 'nucleus-tree-git-file-status',
  status: ' ',
  statusStyles: 'background: #f2d',
  label: 'monikarana',
  labelSecondary: '/styles.scss'
}, {
  subcontentClasses: 'nucleus-tree-git-file-status',
  status: ' ',
  statusStyles: 'background: #d2f',
  label: 'channikhabra',
  labelSecondary: '/test.js'
}];


Template.ultimateBuddyListSidebar.helpers({
  userRows: function() {
    var rows = UltimateIDEUser.collection.find().map(function(user) {
      return {
        subcontentClasses: 'nucleus-tree-git-file-status',
        status: ' ',
        statusStyles: 'background: ' + user.getColor(),
        label: user.username,
        labelSecondary: user.getCwd()
      };
    });

    return rows;
  }
});
