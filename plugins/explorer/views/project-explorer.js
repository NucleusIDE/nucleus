var tree = null;
var state = new ReactiveDict();
var ExpandingTree = new ReactiveVar(null);

function changeHeightOfExplorer() {
    var el = '.explorer-project-files';
    var $el = $(el);
    var workingFilesHeight =  $('.explorer-working-files').parent().parent().height();
    var totalHeights = 35 + 24 + 22 + workingFilesHeight;
    var windowHeight = $(window).height();

    var projectExplorerHeight = windowHeight - totalHeights;

    $el.css({'max-height': projectExplorerHeight});
}
function createFileFolder(type) {
    UltimateIDE.Files.newFileWithPrompt(type, function () {
        state.set('show_project_explorer_spinner', true);

        // Meteor.setTimeout(function () {
        UltimateIDE.Files.updateFileTreeCollection(function (err) {
            if (err) {
                FlashMessages.sendError('Error  while creating new file/folder');
                state.set('show_project_explorer_spinner', false);
                console.log(err);
            }

            state.set('show_project_explorer_spinner', false);
            FlashMessages.sendSuccess('Created new ' + type);
        })
        // }.bind(this), 1000);
    });
};
function renameFileFolder(event) {
    var selectedFile = Session.get('ultimate_selected_folder') || Session.get('ultimate_selected_file');

    if (! selectedFile)
        return alert('Please select a file or folder to rename');

    var siblingDoc = UltimateIDE.Files.tree.findOne({filepath: selectedFile});

    new UltimatePrompt('newFilePrompt', {
        'Old Location': {
            type: String,
            defaultValue: selectedFile
        },
        'New Location': {
            type: String,
            defaultValue: selectedFile.split('/').reverse().slice(1).reverse().join('/') + '/'
        }
    }, {
        title: 'Rename'
    }).show(function (res) {
        var oldName = res['Old Location'],
            newName = res['New Location'];

        UltimateIDE.Files.renameFile(oldName, newName, function (err, res) {
            if (err) {
                console.log('Error while renameing', err);
                return FlashMessages.sendError('Failed to rename file');
            }

        })
    });
};
function deleteFileFolder() {
    var selectedFile = Session.get('ultimate_selected_folder') || Session.get('ultimate_selected_file');

    if (! selectedFile)
        return alert('Please select a file or folder to delete');

    state.set('filepathToDelete', selectedFile);
    $('#deleteModal').modal({backdrop: true});
};

Template.ultimateProjectExplorer.rendered = function () {
    $(window).on('resize.explorer_resize', changeHeightOfExplorer);

    this.autorun(function createExpandingTree() {
        var tree = UltimateIDE.Files.tree.find({}, {fields: {updated_at: false}}).fetch();
        tree = _.sortBy(tree, function (file) {
            return file.updated_at;
        });

        if(tree.length === 0)
            return;

        Tracker.nonreactive(function() {
            ExpandingTree.set(new UltimateExpandingTree(tree));
        });
    });

    var contextMenuId = 'project-explorer-context-menu';
    $('.explorer-project-files').contextmenu({
        target: '#' + contextMenuId,
        before: function(e,context) {
            $('#'+contextMenuId).removeClass('hidden');
        },
        onItem: function(context, e) {
            var action = $(e.target).attr('data-action');

            switch (action) {
            case 'newFile':
                return createFileFolder('file');
            case 'newFolder':
                return createFileFolder('folder');
            case 'rename':
                return renameFileFolder(context);
            case 'delete':
                return deleteFileFolder(context, e);
            }
        }
    })

    $('#'+contextMenuId).on('hide.bs.context', function (e) {
        $('#'+contextMenuId).addClass('hidden');
    });
}
Template.ultimateProjectExplorer.destroyed = function () {
    $(window).off('resize.explorer_resize');
}

Template.ultimateProjectExplorer.helpers({
    rows: function() {
        if(! ExpandingTree.get()) return;
        return ExpandingTree.get().LocalFilesCollection.find();
    },
    showSpinner: function () {
        return state.get('show_project_explorer_spinner');
    }
});

Template.nucleusTree_collapse_row.helpers({
    rowClass: function() {
        var row = this;
        if(row.get('filepath') === Session.get('nucleus_selected_file')) {
            row.set('rowClasses', ''); //I don't know 'hidden' class gets added whenever this helper return something truthy. Have to reset this reactive var
            return 'nucleus-tree__row--focused';
        }
        if(row.get('filepath') === Session.get('ultimate_selected_folder')) {
            row.set('rowClasses', 'nucleus-tree__row--has-children');
            return 'nucleus-tree__row--focused-folder nucleus-tree__row--has-children';
        }
    }
});

Template.ultimateProjectExplorer.events({
    'click .nucleus-tree__row': function(e) {
        var row = this;

        if (row.get('type') === 'file') {
            Session.set('nucleus_selected_file', row.get('filepath'));
            Session.set('ultimate_selected_file', row.get('filepath'));
            Session.set('ultimate_selected_folder', null);

            var isAlreadyInWorkingFiles = false;
            UltimateIDE.Files.workingFiles.forEach(function(file) {
                if (file.filepath === row.get('filepath')) isAlreadyInWorkingFiles = true;
            });
            if (!isAlreadyInWorkingFiles)
                UltimateIDE.Files.addWorkingFile(row.get('filepath'), {
                    temp: true
                });
        }
        if (row.get('type') === 'folder') {
            Session.set('ultimate_selected_folder', row.get('filepath'));
            Session.set('ultimate_selected_file', null);
        }

    },
    'dblclick .nucleus-tree__row': function(e) {
        e.stopPropagation();
        e.preventDefault();
        var row = this;
        if (row.get('type') === 'file') {
            filepath = Utils.dictToObj(row).filepath;
            UltimateIDE.Files.addWorkingFile(filepath, {temp: false});
        }
    }
});

Template.nucleusSplitView.events({
    'click .action-item .nucleus-icon-new-file': function (e) {
        e.preventDefault();
        e.stopPropagation();

        createFileFolder('file');
    },
    'click .action-item .nucleus-icon-new-folder': function (e) {
        e.preventDefault();
        e.stopPropagation();

        createFileFolder('folder');
    },
    'click .action-item .nucleus-icon-refresh-explorer': function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(".ultimate-spinner").removeClass("hidden")
        state.set('show_project_explorer_spinner', true);
        UltimateIDE.Files.tree.find().forEach(function removeFile(file) {
            file.remove();
        });
        UltimateIDE.Files.updateFileTreeCollection(function (err) {
            if(err) {
                return console.error(err);
            }
            $(".ultimate-spinner").addClass("hidden")
            FlashMessages.sendSuccess('Refreshed File Tree');
            state.set('show_project_explorer_spinner', false);
        })
    }
});

Template.ultimateProjectExplorerDeleteModal.helpers({
    fileToDelete: function () {
        return state.get('filepathToDelete');
    }
});
Template.ultimateProjectExplorerDeleteModal.events({
    'click #deleteFile': function (e) {
        var filepath = state.get('filepathToDelete');

        UltimateIDE.Files.deleteFile(filepath, function (err, res) {
            $('#deleteModal').modal('hide');
            state.set('filepathToDelete', null);
            state.set('show_project_explorer_spinner', true);
            if(err) {
                console.log('Error while deleting file: ', err);
                return FlashMessages.sendError('Failed to delete file');
            }

            UltimateIDE.Files.updateFileTreeCollection(function (err, res) {
                if (err) {
                    return console.log(err);
                }

                Meteor.setTimeout(function () {
                    state.set('show_project_explorer_spinner', false);
                }, 1500);
            })

        });
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

//,---------------------------------------------------------
//| XXX: Remove this before pushing the code
//`---------------------------------------------------------
// LiveUpdate.configure({interceptReload: false});
//,---------------------------------------------------------
//| remove upto here
//`---------------------------------------------------------
