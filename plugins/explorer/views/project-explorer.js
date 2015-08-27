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

Template.ultimateProjectExplorer.rendered = function () {
    $(window).on('resize.explorer_resize', changeHeightOfExplorer);

    this.autorun(function createExpandingTree() {
        var tree = UltimateIDE.Files.tree.find({}).fetch();
        var tree = _.sortBy(tree, function (file) {
            return file.updated_at;
        });

        if(tree.length === 0)
            return;

        Tracker.nonreactive(function() {
            ExpandingTree.set(new UltimateExpandingTree(tree));
        });
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

            var isAlreadyInWorkingFiles = false;
            UltimateIDE.Files.workingFiles.forEach(function (file) {
                if(file.filepath === row.get('filepath')) isAlreadyInWorkingFiles = true;
            });
            if(! isAlreadyInWorkingFiles)
                UltimateIDE.Files.addWorkingFile(row.get('filepath'), {temp: true});
        } if (row.get('type') === 'folder') {
            Session.set('ultimate_selected_folder', row.get('filepath'));
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

        UltimateIDE.Files.newFileWithPrompt('file', function () {
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
                }.bind(this))
            // }.bind(this), 1000);
        }.bind(this));
    },
    'click .action-item .nucleus-icon-new-folder': function (e) {
        e.preventDefault();
        e.stopPropagation();

        UltimateIDE.Files.newFileWithPrompt('folder');
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
