// LiveUpdate.configure({
//   interceptReload: false
// });

var workingFilesState = new ReactiveDict();
var projectExplorerState = new ReactiveDict();

workingFilesState.set("collapsed", false);

workingFilesState.set("filetree", {});
projectExplorerState.set('collapsed', false);

Template.ultimateSidebarExplore.helpers({
  workingFiles: function() {
    var files = workingFilesState.get('workingFiles');
    return files;
  },
  workingFilesHeight: function() {
    var height = "100%";

    var appliedHeight = workingFilesState.get('collapsed') ?
          '0px' : height;

    return appliedHeight;
  },
  projectExplorerStyles: function() {
    var collapsed = projectExplorerState.get('collapsed');
    var height = collapsed ? '0px' : '100%';
    var display = collapsed ? 'none' : 'block';
    return "{height: " + height + "; display: " + display + ";}";
  },
  workingFilesSplitView: function() {
    return {
      title: "Working Files",
      actions: [{
        actionClasses: "action-item--disabled",
        actionLabelClasses: "nucleus-icon nucleus-icon-save-all",
        actionTitle: "Save All"
      }, {
        actionClasses: "",
        actionLabelClasses: "nucleus-icon nucleus-icon-close-all",
        actionTitle: "Close All"
      }]
    };
  },
  projectExplorerSplitView: function() {
    return {
      title: "Nucleus Code UI",
      actions: [{
        actionLabelClasses: "nucleus-icon nucleus-icon-new-file",
        actionTitle: "New File"
      }, {
        actionLabelClasses: "nucleus-icon nucleus-icon-new-folder",
        actionTitle: "New Folder"
      }, {
        actionLabelClasses: "nucleus-icon nucleus-icon-refresh-explorer",
        actionTitle: "Refresh"
      }, {
        actionLabelClasses: "nucleus-icon nucleus-icon-collapse-explorer",
        actionTitle: "Close All"
      }]
    };
  }
});
