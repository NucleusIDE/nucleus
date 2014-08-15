Template.editor.rendered = function() {
    $("#nucleus_editor").height($(window).height());
};

Template.nucleus_tree_widget.helpers({
    tree: function() {
        $('#nucleus_file_tree').jstree({
            'core' : {
                'data' : NucleusClient.getJstreeJSON(),
                'themes': {
                    icons: false,
                    stripes: true,
                    responsive: true,
                    dots: false
                }
            }});

        $("#nucleus_file_tree").on("select_node.jstree", function(e,data) {
            Session.set("nucleus_selected_file", data.selected[0]);
        });
    }
});

Template.editor.config = function () {
    return function(editor) {
        editor.setTheme('ace/theme/monokai');
        editor.getSession().setMode('ace/mode/javascript');
        editor.commands.addCommand({
            name: 'saveFile',
            bindKey: {win: 'Ctrl-s',  mac: 'Command-s'},
            exec: function(editor) {
                NucleusClient.saveSelectedFileToDisk();
            },
            readOnly: true // false if this command should not apply in readOnly mode
        });
    };
};

Template.editor.setMode = function() {
    return function(editor) {
        var selectedFile = Session.get("nucleus_selected_file"),
            extRe = /(?:\.([^.]+))?$/,
            ext = extRe.exec(selectedFile)[1],
            aceModesForExts = {
                'html': "handlebars",
                'css': 'css',
                'json': 'json',
                'js': 'javascript',
                'lock': 'json'
            },
            mode = 'ace/mode/' + (aceModesForExts[ext] || ext);

        console.log("MODE IS", mode);
        editor.getSession().setMode(mode);
    };
};

Template.editor.helpers({
    docid: function() {
        return Session.get('nucleus_selected_doc_id') || 'scratch';
    }
});

Template.nucleus_toolbar.events({
    "click #commit_changes": function(e) {
        Meteor.call("nucleusCommitAllChanges", function(err, res) {
            if (res === 1) FlashMessages.sendSuccess("Changes Committed Successfully");
            else if (res === 0) FlashMessages.sendWarning("Nothing to Commit");
            else FlashMessages.sendError("Something Went Wrong with Git Commit");
        });
    },
    "click #push_changes": function(e) {
        Meteor.call("nucleusPushChanges", function(err, res) {
            if (res === 1) FlashMessages.sendSuccess("Changes Pushed Successfully");
            else if (res === 0) FlashMessages.sendWarning("Nothing To Push");
            else FlashMessages.sendError("Something Went Wrong With Git Push");
        });
    },
    "click #pull_changes": function(e) {
        Meteor.call("nucleusPullChanges", function(err, res) {
            if (res === 1) FlashMessages.sendSuccess("New Changes Pulled Successfully");
            else if (res === 0) FlashMessages.sendWarning("Already Up-to-date");
            else FlashMessages.sendError("Something Went Wrong While Pulling Changes");
        });
    }
});


Deps.autorun(function() {
    var selecttedFile = Session.get("nucleus_selected_file");
    if (!selecttedFile) return;

    NucleusClient.editFile(selecttedFile);
});
