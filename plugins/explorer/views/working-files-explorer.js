var workingFilesState = new ReactiveDict();

Template.ultimateWorkingFilesExplorer.rendered = function() {
  var initialChangeCount = 0;

  UltimateIDE.Editor.addEvent('change', function addWorkingDoc() {
    if(initialChangeCount < 2) {
      initialChangeCount++;
      return;
    }

    var filepath = Session.get('nucleus_selected_file');
    if (!filepath)
      return;

    UltimateIDE.Files.addWorkingFile(filepath);
    //a teeny-weeny hack. Events directly set on ace get's washed on document change
    //We exploit that to remove the 'change' event so it will add document to
    //working files only on first change
    UltimateIDE.Editor.editor.session.off('change', addWorkingDoc);
  });
};

Template.ultimateWorkingFilesExplorer.helpers({
  workingFiles: function() {
    var workingFiles = UltimateIDE.Files.workingFiles;
    return workingFiles.map(function(row) {
      return {
        appPath: row.appPath,
        filepath: row.filepath,
        filename: row.name,
        labelClasses: 'working-files-item-label',
        subcontentClasses: 'working-files-item',
        actions: [{
          filepath: row.filepath,
          actionLabelClasses: 'nucleus-icon nucleus-icon-close-file'
        }]
      };
    });
  }
});

Template.ultimateWorkingFilesExplorer.events = {
  'click .nucleus-tree__row': function(e) {
    Session.set('nucleus_selected_file', this.filepath);
  },
  'click .nucleus-actionsbar__item': function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log(this);
    UltimateIDE.Files.removeWorkingFile(this.filepath);
  }
};
