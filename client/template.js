Template.nucleus_nick_prompt.rendered = function() {
    //this is just a remider in case we change css in stylesheet and keyup handler in events fuck up styles on error/success
    $("#nick").css({
        boxShadow: "0 0 29px 0px rgba(17,153,230, 0.9)",
        border: "1px solid rgba(17,153,230,0.5)"
    });
    $("#nick").focus();
};


Template.nucleus_nick_prompt.helpers({
    no_nuc_user: function() {
        return ! Session.get("nucleus_user");
    }
});

Template.nucleus_nick_prompt.events({
    "blur #nick": function() {
        $("#nick").focus();
    },
    "keyup #nick": function(e) {
        e.preventDefault();
        var $in = $("#nick"),
            nick = $in.val(),
            validNick = nick.length > 3 && ! NucleusUsers.findOne({nick: $in.val()}) && nick.indexOf(" ") < 0;

        if($in.val() === "") {
            $("#nick").css({
                boxShadow: "0 0 29px 0px rgba(17,153,230, 0.9)",
                border: "1px solid rgba(17,153,230,0.5)"
            });
            return false;
        }

        if (!validNick) {
            $("#nick").css({
                boxShadow: "0 0 29px 0px rgba(218, 61, 66, 0.9)",
                border: "1px solid rgba(218, 61, 66,0.5)"
            });
        } else {
            $("#nick").css({
                boxShadow: "0 0 29px 0px rgba(17, 230, 179, 0.9)",
                border: "1px solid rgba(17, 230, 179, 0.5)"
            });
        }

        if (e.keyCode === 13 && validNick) {
            var nucUser = NucleusUser.new(nick);
        }
    }
});

Template.nucleus_tree_widget.helpers({
    tree: function() {
        $("#nucleus_file_tree").on("select_node.jstree", function(e,data) {
            if(data.node.data.type === 'folder') {
                if(data.node.state.opened)
                    NucleusClient.jsTree.close_node(data.node);
                else
                    NucleusClient.jsTree.open_node(data.node);
            }
            if(data.node.data.type === 'file') {
                Session.set("nucleus_selected_file", data.selected[0]);
            }
        });
        Meteor.setTimeout(function() {
            var fileTree = $('#nucleus_file_tree').jstree({
                'core' : {
                    // 'data' : NucleusClient.getJstreeJSON(),
                    'themes': {
                        icons: false,
                        stripes: false,
                        responsive: true,
                        dots: false
                    },
                    'multiple': false
                }});
            NucleusClient.jsTree = fileTree;
        }, 300);
        return NucleusClient.getJstreeHTML();
    }
});

Template.editor.rendered = function() {
    $("#nucleus_editor").height($(window).height());
};

Template.editor.config = function () {
    return function(editor) {
        NucleusEditor.initilize(editor);
    };
};

Template.editor.setMode = function() {
    return function(editor) {
        var selectedFile = Session.get("nucleus_selected_file"),
            extRe = /(?:\.([^.]+))?$/,
            ext = extRe.exec(selectedFile)[1];
        NucleusEditor.setModeForExt(ext);
        //some events get unregistered on filechange
        NucleusEditor.registerAllEvents();
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

Deps.autorun(function() {
    var users = NucleusClient.getOnlineUsers().fetch();

    _.each(users, function(user) {
        NucleusSidebar.updateUserStatusBox(user);
        // below function should execute only When NucleusEditor is initialized with ace instance
        NucleusEditor.getEditor() && NucleusEditor.userAreOnSameFile(NucleusUser.me(), user) && NucleusEditor.updateCursorForUser(user);
    });
});
