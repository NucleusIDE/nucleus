var tree = null;
var state = new ReactiveDict();

function changeHeightOfExplorer() {
  var el = '.explorer-project-files';
  var $el = $(el);
  var workingFilesHeight =  $('.explorer-working-files').parent().parent().height();
  var totalHeights = 35 + 24 + 22 + workingFilesHeight;
  var windowHeight = $(window).height();

  var projectExplorerHeight = windowHeight - totalHeights;

  $el.css({'max-height': projectExplorerHeight});
}

Template.ultimateProjectExplorer.rendered = function () {
  $(window).on('resize.explorer_resize', changeHeightOfExplorer);
}
Template.ultimateProjectExplorer.destroyed = function () {
  $(window).off('resize.explorer_resize');
}

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

      var isAlreadyInWorkingFiles = false;
      UltimateIDE.Files.workingFiles.forEach(function (file) {
        if(file.filepath === row.get('filepath')) isAlreadyInWorkingFiles = true;
      });
      if(! isAlreadyInWorkingFiles)
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

/**
 * Autorun to dynamically change height of project-explorer when the height of
 * working-files-explorer changes
 */
Tracker.autorun(function projectExplorerDynamicHeight() {
  var workingFilesCount = UltimateIDE.Files.workingFiles.count(); //we need this to make this autorun work reactively
  var el = '.explorer-project-files';

  Utils.when(
    function explorerRenderedP() { return $(el).length; },
    changeHeightOfExplorer,
    400,
    null,
    false
  )
});
