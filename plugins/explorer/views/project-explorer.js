var tree = null;
var state = new ReactiveDict();

Template.ultimateProjectExplorer.helpers({
  rows: function() {
    var tree = UltimateIDE.Files.tree.find({}, {sort: {created_at: 1}}),
        expandingTree = null;

    if(tree.count() === 0)
      return [];

    Tracker.nonreactive(function() {
      expandingTree = new UltimateExpandingTree(tree.fetch());
    });

    return _.map(expandingTree.nodes, function(node) {
      return node;
    });
  }
});

Template.nucleusTree_collapse_row.helpers({
  rowClass: function() {
    var row = this;
    if(row.get('filepath') === Session.get('nucleus_selected_file')) {
      row.set('rowClasses', ''); //I don't know 'hidden' class gets added whenever this helper return something truthy. Have to reset this reactive var
      return 'nucleus-tree__row--focused';
    }
  }
});

Template.ultimateProjectExplorer.events({
  "click .nucleus-tree__row": function(e) {
    var row = this;

    if (row.get('type') === 'file') {
      Session.set('nucleus_selected_file', row.get('filepath'));
      UltimateIDE.Files.addWorkingFile(row.get('filepath'), {temp: true});
    }
  },
  "dblclick .nucleus-tree__row": function(e) {
    var row = this;
    if (row.get('type') === 'file') {
      filepath = Utils.dictToObj(row).filepath;
      UltimateIDE.Files.addWorkingFile(filepath, {temp: false});
    }
  }
});
