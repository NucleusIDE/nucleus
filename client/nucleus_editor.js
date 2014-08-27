var showLabelOnMouseMove = function(e) {
    var mousePos = [e.clientX,e.clientY];

    var getRectangleForElem = function(elem) {
        var boundingRect = elem.getBoundingClientRect(),
            topLeft = [boundingRect.left, boundingRect.top],
            bottomRight = [boundingRect.right, boundingRect.bottom];

        return [topLeft, bottomRight];
    };

    var pointIsInRect = function(point, rect) {
        var x = point[0],
            y = point[1];

        var z1 = rect[0][0],
            z2 = rect[0][1],
            z3 = rect[1][0],
            z4 = rect[1][1];

        var x1 = Math.min(z1, z3),
            x2 = Math.max(z1, z3),
            y1 = Math.min(z2, z4),
            y2 = Math.max(z2, z4);

        return (x1 <= x && x <= x2) && (y1 <= y && y <= y2);
    };

    var cursorRects = _.map(Object.keys(NucleusEditor.extraCursors), function(userId) {
        var elem = document.getElementsByClassName(NucleusEditor.extraCursors[userId].class)[0];
        return {userId: userId, rect: getRectangleForElem(elem)};
    });

    _.each(cursorRects, function(item) {
        if(pointIsInRect(mousePos, item.rect))
            NucleusEditor.showLabelForUser(item.userId);
        else
            NucleusEditor.clearCursorLabel();
    });
};


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
        cursorMovement: [],
        mouseMove: [
            showLabelOnMouseMove
        ]
    };
    this.Range = ace.require('ace/range').Range;

    this.initilize = function(aceInstance) {
        this.setEditor(aceInstance);
        this.setTheme('monokai');
        this.setMode('javascript');
        this.editor.setHighlightActiveLine(false);
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

        var mouseMoveEvents = this.events.mouseMove;
        _.each(mouseMoveEvents, function(action) {
            this.editor[binder]("mousemove", action);
        }.bind(this));
    };
    this.unregisterAllEvents = function() {
        this.registerAllEvents(true);
    };


    this.clearCursorLabel = function() {
        var $label = $(".user_nick_cursor_label");
        $label.css({display: "none"});
    };

    this.showLabelForUser = function(user) {
        user = typeof user === 'string' ? NucleusUsers.findOne(user) : user;

        var userCursorRange = this.extraCursors[user._id].range,
            userCursorPos = this.editor.renderer.textToScreenCoordinates(userCursorRange.start.row, userCursorRange.start.column),
            color = user.getColor(),
            nick = user.getNick();

        var lineHeight = this.editor.renderer.lineHeight;

        var $label = $(".user_nick_cursor_label");
        $label.text(nick);
        $label.css({display: 'inline', top: userCursorPos.pageY+lineHeight, left: userCursorPos.pageX, background: color, padding: "2px", color: Utils.getComplementoryColor(color), lineHeight: lineHeight+'px'});
    };

    this.insertExtraCursor = function(user) {
        var cursor = user.getCursor(),
            row =  cursor[0],
            column = cursor[1],
            cursorRange = new this.Range(row, column, row, column),
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
        return {range: cursorRange, class: curClass};
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

        var userId = user._id;
        if(! user.getCursor()) return;
        if(this.extraCursors[userId])
            this.removeCursor(this.extraCursors[userId].range);
        this.extraCursors[userId] = this.insertExtraCursor(user);
    };

    this.userAreOnSameFile = function(user1, user2) {
        if (!(user1 && user2)) return false;
        return user1.getCwd() === user2.getCwd();
    };

    return this;
};

NucleusEditor = new NucleusEditorFactory();

NucleusEditor.addCursorMovementAction(function(e) {
    var cursor = NucleusEditor.getSelection().getCursor();
    NucleusUser.me() && NucleusUser.me().setCursor(cursor.row, cursor.column);
});
