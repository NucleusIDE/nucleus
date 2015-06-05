var workingFilesState = new ReactiveDict();

window.GlobalState = GlobalState;
GlobalState.set('workingFiles', []);

Template.nucleusSidebarExplore.helpers({
  workingFiles: function() {
    var workingFiles = GlobalState.get('workingFiles');
    return workingFiles.map(function(row) {
      return {
        filename: row.name,
        filepath: row.id,
        labelClasses: 'working-files-item-label',
        subcontentClasses: "working-files-item",
        actions: [{
          actionLabelClasses: "nucleus-icon nucleus-icon-close-file"
        }]
      };
    });
  }
});
