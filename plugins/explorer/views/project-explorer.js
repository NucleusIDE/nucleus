var tree = null;
var state = new ReactiveDict();

Tracker.autorun(function() {
  state.set('tree', UltimateIDE.getFileTree());
});

Template.ultimateProjectExplorer.helpers({
  rows: function() {
    var tree = state.get('tree'),
        expandingTree = null;

    if(!tree)
      return [];

    Tracker.nonreactive(function() {
      expandingTree = new NucleusExpandingTree(tree);
    });

    return _.map(expandingTree.nodes, function(node) {
      return node;
    });
  }
});

Template.nucleusTree_collapse_row.helpers({
  rowClass: function() {
    var row = this;
    if(row.get('id') === Session.get('nucleus_selected_file')) {
      row.set('rowClasses', ''); //I don't know 'hidden' class gets added whenever this helper return something truthy. Have to reset this reactive var
      return 'nucleus-tree__row--focused';
    }
  }
});

Template.ultimateProjectExplorer.events({
  "click .nucleus-tree__row": function() {
    var row = this;

    if (row.get('type') === 'file') {
      Session.set('nucleus_selected_file', row.get('id'));
    }
  },
  "dblclick .nucleus-tree__row": function(e) {
    var row = this;
    if (row.get('type') === 'file') {
      row = Utils.dictToObj(row);
      UltimateIDE.Explorer.addWorkingFile(row);
    }
  }
});
