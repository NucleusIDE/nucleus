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

Template.editor.helpers({
    docid: function() {
        return Session.get('nucleus_selected_doc_id') || 'scratch';
    }
});

Deps.autorun(function() {
    var selecttedFile = Session.get("nucleus_selected_file");
    if (!selecttedFile) return;

    NucleusClient.editFile(selecttedFile);
});
