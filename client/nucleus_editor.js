/**
 * # NucleusEditor
 */

/**
 * Show user's nick in label when mouse is moved to her cursor in ace editor.
 *
 * We get rectangles around the cursors, and check if the mouse is in any of those rectangles.
 */
var showLabelOnMouseMove = function(e) {
  var mousePos = [e.clientX,e.clientY];

  //Get the rectangle around the cursor element in ace
  var getRectangleForElem = function(elem) {
    if(!elem) return false;;
    var boundingRect = elem.getBoundingClientRect(),
        topLeft = [boundingRect.left, boundingRect.top],
        bottomRight = [boundingRect.right, boundingRect.bottom];

    return [topLeft, bottomRight];
  };

  //Check if given `point` is in `rect` rectangle
  var pointIsInRect = function(point, rect) {
    var x = point[0],
        y = point[1];

    if (!rect || !rect[0] || !rect[0][0]) {
      return false;
    }

    var z1 = rect[0][0],
        z2 = rect[0][1],
        z3 = rect[1][0],
        z4 = rect[1][1];

    var x1 = Math.min(z1, z3),
        x2 = Math.max(z1, z3),
        y1 = Math.min(z2, z4),
        y2 = Math.max(z2, z4);

    return (x1-3 <= x && x <= x2+3) && (y1 <= y && y <= y2);
  };

  //get rectangles for all extra cursors present in the ace editor. Every online user has a cursor.
  var cursorRects = _.map(Object.keys(NucleusEditor.extraCursors), function(userId) {
    var elem = document.getElementsByClassName(NucleusEditor.extraCursors[userId].class)[0];
    return {userId: userId, rect: getRectangleForElem(elem)};
  });

  //Check if the mouse position is in any of the `cursorRects`. If it's in some cursorRect, show the label, otherwise clear the cursor label
  _.each(cursorRects, function(item) {
    if(pointIsInRect(mousePos, item.rect))
      NucleusEditor.showLabelForUser(item.userId);
    else
      NucleusEditor.clearCursorLabel();
  });
};

/**
 * Constructor for `NucleusEditor`
 */
var NucleusEditorFactory = function() {
  //Ace editor instance. This is populated in templates.js when sharejs initializes the ace editor
  this.editor = null;
  //Array of all extra cursors present
  this.extraCursors = {};
  this.addedStyleRules = {};
  //when refactoring this code, if possible use Object.keys instead of this.allEvents
  this.allEvents = [];
  //simple key-value pair for assigning ace-modes for documents depending on the extension of the file being edited
  this.aceModesForExts = {
    'html': "handlebars",
    'css': 'css',
    'json': 'json',
    'js': 'javascript',
    'lock': 'json',
    'less': 'less',
    'sass': 'sass',
    'scss': 'sass'
  };
  //This part might be over-engineered, or might not be. Objective was to have a singular point for all the events that we have on the ace-editor
  this.events = {
    cursorMovement: [],
    mouseMove: [
      showLabelOnMouseMove
    ],
    scroll: []
  };
  this.Range = ace.require('ace/range').Range;

  /**
   * We initialize the `NucleusEditor` in template.js when we get ace-editor instance from shareJs
   */
  this.initialize = function(aceInstance) {
    this.setEditor(aceInstance);
    this.setTheme('tomorrow_night');
    // this.setTheme('ambiance');

    var filepath = Session.get("nucleus_selected_file");
    if(filepath) {
      var ext = filepath.split('.').reverse()[0];
      this.setModeForExt(ext);
    }

    //Highlighting active line would make the extra cursors disappear from that line.
    this.editor.setHighlightActiveLine(false);
    //Some basic commands
    this.addCommands([
      {
        name: 'saveFile',
        bindKey: {win: 'Ctrl-s',  mac: 'Command-s'},
        exec: function(editor) {
          // Save the file currently being edited in user's ace editor
          UltimateIDE.saveSelectedFileToDisk();
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
    if (typeof mode == 'undefined')
      mode = 'text';

    this.getSession().setMode("ace/mode/"+ mode);
  };
  this.setTheme = function(theme) {
    this.getEditor().setTheme("ace/theme/" + theme);
  };

  //I don't even know why I am over-engineering this shit. Just based on a hunch
  this.addCursorMovementAction = function(action) {
    this.events.cursorMovement.push(action);
    this.registerAllEvents();
  };

  this.addModeForExt = function(obj) {
    _.extend(this.aceModesForExts, obj);
  };
  //This method is used for setting the mode of document on every doc change
  this.setModeForExt = function(ext) {
    if (!ext)
      return;

    var mode = this.aceModesForExts[ext] || 'text';
    this.setMode(mode);
  };

  this.addCommands = function(commands) {
    _.each(commands, function(command) {
      this.getEditor().commands.addCommand(command);
    }.bind(this));
  };

  this.addEvent = function(eventName, fn) {
    if(!this.events.eventName) {
      this.events[eventName] = [];
      this.allEvents.push(eventName);
    }

    this.events[eventName].push(fn);
  };

  this.removeEvent = function(eventName, fn) {
    if(!this.events[eventName]) return;

    var index = this.events[eventName].indexOf(fn);
    if (index > -1) {
      this.events[eventName].splice(index, 1);
    }
  };

  /**
   * This is why I have the events over-engineered. A more elegent solution might be possible though.
   *
   * This method registers all the events in `NucleusEditor.events`. Thing is that when the document in ace editor changes, it would drop all the events registered on the editor. We need to register them all again every time document being edited changes.
   *
   * *Arguments:*
   * * `invert` *{boolean}*: Shall I perform the inverted operation? i.e unregister events instead of registering them
   */
  this.registerAllEvents = function(invert) {
    var ed = this;

    if(! this.getEditor()) {
      var interval = Meteor.setInterval(function() {
        if(this.getEditor()) {
          Meteor.clearInterval(interval);
          this.registerAllEvents(invert);
        }
      }.bind(this), 100);
      return;
    }
    //Let's unbind all events before adding new ones to avoid double events.
    //May be this is why I am overdoing it. I have a deja-vu feeling I've been here struggling with ace double events
    //although I don't remember working with this part of ace
    var binder = invert ? "off" : "on";
    /* well, ace don't really double call events when we call registerAllEvents multiple times, but let's keep it
     *
     *TODO: remove it if double events are not a problem
     */

    var cursorEvents = this.events.cursorMovement;
    _.each(cursorEvents, function(action) {
      this.getSelection()[binder]("changeCursor", action);
    }.bind(this));

    var mouseMoveEvents = this.events.mouseMove;
    _.each(mouseMoveEvents, function(action) {
      this.editor[binder]("mousemove", action);
    }.bind(this));

    //For all other events. cursorEvents and mouseMoveEvents should be turned to use this on refactor
    _.each(ed.allEvents, function(event) {
      _.each(ed.events[event], function(action) {
        /*some events need to be set on session, editor or some other property of ace editor
         *
         *FIXME: make this choice dynamic
         */
        ed.editor.session[binder](event, action);
      });
    });

  };

  this.unregisterAllEvents = function() {
    this.registerAllEvents(true);
  };


  /**
   * Remove the cursor label from ace editor
   */
  this.clearCursorLabel = function() {
    var $label = $(".user_nick_cursor_label");
    $label.css({display: "none"});
  };

  /**
   * Show the label for `user`.
   *
   * *Arguments:*
   * * `user` *{string}* or *{NucleusUser}*
   */
  this.showLabelForUser = function(user) {
    user = typeof user === 'string' ? NucleusUsers.findOne(user) : user;

    var userCursorRange = this.extraCursors[user._id].range,
        userCursorPos = this.editor.renderer.textToScreenCoordinates(userCursorRange.start.row, userCursorRange.start.column),
        color = user.getColor(),
        nick = user.getNick();

    var lineHeight = this.editor.renderer.lineHeight;

    var $label = $(".user_nick_cursor_label");
    $label.text(nick);
    $label.css({display: 'inline', top: userCursorPos.pageY+lineHeight, left: userCursorPos.pageX, background: color, padding: "2px", color: Utils.getComplementoryColor(color), lineHeight: lineHeight+'px', "text-shadow": "0 0 2px #222"});
  };

  /**
   * Insert the extra cursor for `user`. It's called extra cursor because these cursors are inserted for all users except the currently logged in users.
   * We create an element and assign it color which is same as the color assigned to a user to be displayed in sidebar status box.
   *
   * Return value from this method is kept in `NucleusEditor.extraCursors` for interacting with these cursors
   *
   * *Arguments:*
   * * `user`: *{string}* or *{NucleusUser}*
   */
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


    //CSS for new cursor to be inserted
    var cursorCss = "."+ curClass +" {\
    position: absolute;\
    background-color: " + color + ";\
    border-left: 2px solid "+ color + ";\
    animation: nuc-blink 0.8s steps(5, start) infinite; \
      -webkit-animation: nuc-blink 0.8s steps(5, start) infinite; \
  }";
    //Check documentation for `NucleusEditor.addStyleRule()`
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
    cursorRange.id = session.addMarker(cursorRange, curClass + " cursor-"+nick, "text");
    return {range: cursorRange, class: curClass};
  };

  /**
   * This is a helper function which we use for inserting style rules in head. We can't insert style directly into inserted extra cursors in ace, we can insert classes though. So we insert classes in the cursors, and add style rules for those classes using this function.
   */
  this.addStyleRule = function(css) {
    var document = UltimateIDE.getWindow().document;
    if(!document) return;

    var styleElement = document.createElement('style');

    document.documentElement.getElementsByTagName('head')[0].appendChild(styleElement);
    this.addedStyleSheet = styleElement.sheet;
    if(this.addedStyleRules[css]) return;

    this.addedStyleRules[css] = true;
    this.addedStyleSheet.insertRule(css, 0);
  };

  /**
   * Remove the cursor corresponding to `cursorRange`
   *
   * *Arguments:*
   * * `cursorRange` *{Ace Range}* : This is retrieved from `NucleusEditor.extraCursors`
   */
  this.removeCursor = function(cursorRange) {
    cursorRange.start && cursorRange.start.detach();
    cursorRange.end && cursorRange.end.detach();
    this.getSession().removeMarker(cursorRange.id);
  };

  /**
   * Update the cursor for `user`. It simply remove the cursor and create it in user's changed cursor position
   *
   * *Arguments:*
   * * `user` *{NucleusUser}*
   */
  this.updateCursorForUser = function(user) {
    if (! NucleusUser.me() || user._id === NucleusUser.me()._id) return;

    var userId = user._id;
    if(! user.getCursor()) return;
    if(this.extraCursors[userId])
      this.removeCursor(this.extraCursors[userId].range);
    this.extraCursors[userId] = this.insertExtraCursor(user);
  };

  /**
   * Check if `user1` and `user2` are on same file
   */
  this.userAreOnSameFile = function(user1, user2) {
    if (!(user1 && user2)) return false;
    return user1.getCwd() === user2.getCwd();
  };

  return this;
};

NucleusEditor = new NucleusEditorFactory();

/**
 * Update user's cursor position in mongo db when he changes his cursor. This will automatically update user's cursor on all other users' editors
 */
NucleusEditor.addCursorMovementAction(function(e) {
  var cursor = NucleusEditor.getSelection().getCursor();
  NucleusUser.me() && NucleusUser.me().setCursor(cursor.row, cursor.column);
});
