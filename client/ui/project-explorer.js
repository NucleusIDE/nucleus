var tree = null;
var state = new ReactiveDict();

Tracker.autorun(function() {
  state.set('tree', NucleusClient.getFileTree());
});


window.state = state;
Template.nucleusProjectExplorer.helpers({
  treeHeight: function() {
    var tree = state.get('tree');
    if(!tree)
      return '0px';
    return '50vh';
  },
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
