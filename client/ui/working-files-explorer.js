var workingFilesState = new ReactiveDict();

window.GlobalState = GlobalState;
GlobalState.set('workingFiles', []);

Template.nucleusWorkingFilesExplorer.helpers({
  workingFiles: function() {
    var workingFiles = GlobalState.get('workingFiles');
    return workingFiles.map(function(row) {
      return {
        id: row.id,
        filename: row.name,
        filepath: row.appPath,
        labelClasses: 'working-files-item-label',
        subcontentClasses: "working-files-item",
        actions: [{
          id: row.id,
          actionLabelClasses: "nucleus-icon nucleus-icon-close-file"
        }]
      };
    });
  },
});

Template.nucleusWorkingFilesExplorer.events = {
  "click .nucleus-tree__row": function(e) {
    Session.set('nucleus_selected_file', this.id);
  },
  "click .nucleus-actionsbar__item": function(e) {
    e.preventDefault();
    e.stopPropagation();

    var row = this;
    var workingFiles = GlobalState.get('workingFiles');

    workingFiles = _.filter(workingFiles, function(file) {
      return file.id !== row.id;
    });

    GlobalState.set('workingFiles', workingFiles);
  }
};
