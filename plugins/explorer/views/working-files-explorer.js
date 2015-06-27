var workingFilesState = new ReactiveDict();

Template.ultimateWorkingFilesExplorer.rendered = function() {
  UltimateIDE.Editor.addEvent('change', function addWorkingDoc() {
    var filepath = Session.get('nucleus_selected_file');
    if (!filepath)
      return;

    var file = R.filter(function(row) {
      return row.id === filepath;
    }, UltimateIDE.getFileTree())[0];

    UltimateIDE.Explorer.addWorkingFile(file);
    //a teeny-weeny hack. Events directly set on ace get's washed on document change
    //We exploit that to remove the 'change' event so it will add document to
    //working files only on first change
    UltimateIDE.Editor.editor.session.off('change', addWorkingDoc);
  });
};

Template.ultimateWorkingFilesExplorer.helpers({
  workingFiles: function() {
    var workingFiles = UltimateIDE.Explorer.workingFiles.get();
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
  }
});

Template.ultimateWorkingFilesExplorer.events = {
  "click .nucleus-tree__row": function(e) {
    Session.set('nucleus_selected_file', this.id);
  },
  "click .nucleus-actionsbar__item": function(e) {
    e.preventDefault();
    e.stopPropagation();

    var row = this;
    UltimateIDE.Explorer.removeWorkingFile(row);
  }
};
