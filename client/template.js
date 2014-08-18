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
    },
    "click #as_a_guest": function(e) {
        e.preventDefault();
        NucleusClient.editor.setReadOnly(true);
    }
});

Template.editor.rendered = function() {
    $("#nucleus_editor").height($(window).height());
};

Template.nucleus_tree_widget.helpers({
    tree: function() {
        console.log("CREATING THE TREE");
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

Template.editor.config = function () {
    return function(editor) {
        NucleusClient.setEditor(editor);
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

Deps.autorun(function() {
    var users = NucleusClient.getOnlineUsers().fetch();

    //clear all user-status boxes
    // $(".user-status-box").remove();

    //setup a user-status box for each user
    _.each(users, function(user) {
        var $currNickNode = $("[data-user-nick="+user.getNick()+"]"),
            currentFile = $currNickNode.parent().attr("id");

        if (user && user.getCurrentFilepath() === currentFile) {
            console.log("USER", user.getNick(), "IS ON SAME FILE", currentFile);
            return;
        } else {
            $currNickNode.remove();
        }

        var interval = Meteor.setInterval(function() {
            var li = document.getElementById(user.getCurrentFilepath());
            if (li) {
                Meteor.clearInterval(interval);
                var i = document.createElement("i");
                i.className = "user-status-box hint--left";
                i.style.cssText = "background:" + user.getColor();
                i.setAttribute('data-user-nick', user.getNick());
                i.setAttribute('data-hint', user.getNick());
                li.appendChild(i);
                i.style.opacity = 0;
                window.getComputedStyle(i).opacity; //this is so the transition b/w opacity of i work
                i.style.opacity = 1;
            }
        },100);
    });
});
