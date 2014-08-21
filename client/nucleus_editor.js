var NucleusEditorFactory = function() {
    this.editor = null;
    this.extraCursors = {};
    this.addedStyleRules = {};
    this.aceModesForExts = {
        'html': "handlebars",
        'css': 'css',
        'json': 'json',
        'js': 'javascript',
        'lock': 'json'
    };
    this.events = {
        cursorMovement: []
    };
    this.Range = ace.require('ace/range').Range;

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

    this.setEditor = function(aceInstance) {
        this.editor = aceInstance;
    };
    this.getEditor = function() {
        return this.editor;
    };

    this.getSession = function() {
        return this.getEditor().getSession();
    };

    this.getSelection = function() {
        return this.getEditor().getSelection();
    };

    this.setMode = function(mode) {
        this.getSession().setMode("ace/mode/"+ mode);
    };
    this.setTheme = function(theme) {
        this.getEditor().setTheme("ace/theme/" + theme);
    };

    this.addCursorMovementAction = function(action) {
        //I don't even know why I am overdoing this shit. Just based on a hunch
        this.events.cursorMovement.push(action);
        this.registerAllEvents();
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
            this.getEditor().commands.addCommand(command);
        }.bind(this));
    };

    this.registerAllEvents = function(invert) {
        if(! this.getEditor()) {
            var interval = Meteor.setInterval(function() {
                if(this.getEditor()) {
                    Meteor.clearInterval(interval);
                    this.registerAllEvents(invert);
                }
            }.bind(this), 100);
            return;
        }
        //let's unbind all events before adding new ones to avoid double events.
        //May be this is why I am overdoing it. I have a deja-vu feeling I've been here struggling with ace double events
        //although I don't remember working with this part of ace
        var binder = invert ? "off" : "on";
        // well, ace don't really double call events when we call registerAllEvents multiple times, but let's keep it
        //TODO: remove it if double events are not a problem TODAY: Tue Aug 19 14:42:19 2014
        // if(binder === 'on') this.registerAllEvents(true);

        var cursorEvents = this.events.cursorMovement;
        _.each(cursorEvents, function(action) {
            this.getSelection()[binder]("changeCursor", action);
        }.bind(this));
    };
    this.unregisterAllEvents = function() {
        this.registerAllEvents(true);
    };

    this.insertExtraCursor = function(row, column, user) {
        var cursorRange = new this.Range(row, column, row, column),
            session = this.getSession(),
            doc = session.getDocument(),
            self = this,
            user = typeof user === 'string' ? NucleusUsers.findOne(user) : user,
            color = user.getColor(),
            nick = user.getNick(),
            curClass = "extra-ace-cursor-"+color.replace("#", '');


        var cursorCss = "."+ curClass +" {\
        position: absolute;\
        background-color: " + color + ";\
        border-left: 2px solid "+ color + ";\
        }";
        this.addStyleRule(cursorCss);
        //I don't really know why this is needed. I copied this from firepad code
        cursorRange.clipRows = function() {
            var localRange = new self.Range().clipRows.apply(this, arguments);
            localRange.isEmpty = function() {
                return false;
            };
            return localRange;
        };

        cursorRange.start = doc.createAnchor(cursorRange.start);
        cursorRange.end = doc.createAnchor(cursorRange.end);
        cursorRange.id = session.addMarker(cursorRange, curClass + " blink" + " cursor-"+nick, "text");

        return cursorRange;
    };

    this.addStyleRule= function(css) {
        var document = NucleusClient.getWindow().document;
        if(!document) return;

        var styleElement = document.createElement('style');

        document.documentElement.getElementsByTagName('head')[0].appendChild(styleElement);
        this.addedStyleSheet = styleElement.sheet;
        if(this.addedStyleRules[css]) return;

        this.addedStyleRules[css] = true;
        this.addedStyleSheet.insertRule(css, 0);
    };

    this.removeCursor = function(cursorRange) {
        cursorRange.start.detach();
        cursorRange.end.detach();
        this.getSession().removeMarker(cursorRange.id);
    };

    this.updateCursorForUser = function(user) {
        if (! NucleusUser.me() || user._id === NucleusUser.me()._id) return;

        var pos = user.getCursor(),
            userId = user._id,
            color = user.getColor();
        if(! pos) return;
        if(this.extraCursors[userId])
            this.removeCursor(this.extraCursors[userId]);
        this.extraCursors[userId] = this.insertExtraCursor(pos[0], pos[1], user);
    };

    this.userAreOnSameFile = function(user1, user2) {
        return user1.getCwd() === user2.getCwd();
    };

    return this;
};

NucleusEditor = new NucleusEditorFactory();

NucleusEditor.addCursorMovementAction(function(e) {
    var cursor = NucleusEditor.getSelection().getCursor();
    NucleusUser.me() && NucleusUser.me().setCursor(cursor.row, cursor.column);
});
