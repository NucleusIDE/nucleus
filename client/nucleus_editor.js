var NucleusEditorFactory = function() {
    this.editor = null;
    this.aceModesForExts = {
        'html': "handlebars",
        'css': 'css',
        'json': 'json',
        'js': 'javascript',
        'lock': 'json'
    };

    this.setEditor = function(aceInstance) {
        this.editor = aceInstance;
    };
    this.getEditor = function() {
        return this.editor;
    };

    this.getSession = function() {
        return this.getEditor().getSession();
    };


    this.setMode = function(mode) {
        this.getSession().setMode("ace/mode/"+ mode);
    };
    this.setTheme = function(theme) {
        this.getEditor().setTheme("ace/theme/" + theme);
    };

    this.addModeForExt = function(obj) {
        _.extend(this.aceModesForExts, obj);
    };
    this.setModeForExt = function(ext) {
        var mode = this.aceModesForExts[ext] || ext;
        this.setMode(mode);
    };

    this.addCommands = function(commands) {
        _.each(commands, function(command) {
            console.log(this.getEditor());
            this.getEditor().commands.addCommand(command);
        }.bind(this));
    };

    this.initilize = function(aceInstance) {
        this.setEditor(aceInstance);
        this.setTheme('monokai');
        this.setMode('javascript');
        this.addCommands([
            {
                name: 'saveFile',
                bindKey: {win: 'Ctrl-s',  mac: 'Command-s'},
                exec: function(editor) {
                    NucleusClient.saveSelectedFileToDisk();
                },
                readOnly: true // false if this command should not apply in readOnly mode
            }
        ]);
    };

    return this;
};

NucleusEditor = new NucleusEditorFactory();
