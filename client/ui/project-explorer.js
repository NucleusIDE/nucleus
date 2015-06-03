var tree = null;
var state = new ReactiveDict();

Tracker.autorun(function() {
  state.set('tree', NucleusClient.getFileTree());
});

Template.nucleusProjectExplorer.helpers({
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

Template.nucleusProjectExplorer.events({
  "click .nucleus-tree__row": function(e) {
    var row = this;
    if (row.get('type') === 'file') {
      Session.set('nucleus_selected_file', row.get('id'));
    }
  }
});
