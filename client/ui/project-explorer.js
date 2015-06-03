var tree = null;
var state = new ReactiveDict();

Tracker.autorun(function() {
  state.set('tree', NucleusClient.getFileTree());
});

Template.nucleusProjectExplorer.helpers({
  rows: function() {
    var tree = state.get('tree');

    if (tree) {
      Tracker.nonreactive(function() {
        tree = new NucleusExpandingTree(tree);
      });
    } else {
      return [];
    }

    return Object.keys(tree.nodes).map(function(key) {
      return tree.nodes[key];
    });
  },
});

Template.nucleusProjectExplorer.events({
  "click .nucleus-tree__row": function(e) {
    var row = this;
    if (row.get('type') === 'file') {
      Session.set('nucleus_selected_file', row.get('id'));
    }
  }
});
