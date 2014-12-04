/**
 # NucleusUser
 ## Attributes
 * * _id :                          MONGO ID
 * * nick :                        STRING (Nickname)
 * * cwd :                         MONGO ID (Current Working Document)
 * * current_filepath :                     STRING
 * * color :                        STRING
 * * cursor_pos :                  ARRAY [row, col]
 * * syncing_nucleus_events :       BOOLEAN
 * * syncing_app_events :       BOOLEAN

 * ## Why?
 * We are not using meteor's password based auth, or any kind of auth for nucleus. We have our own user system. Users log in by providing a nick. That nick sets a session variable and a cookie which are removed `onbeforeunload` of `window`.
 */


NucleusUsers = new Meteor.Collection('nucleus_users');
NucleusUser = Model(NucleusUsers);

NucleusUser.extend({
  getCwd: function() {
    return this.cwd;
  },
  setCwd: function(docId) {
    this.update({cwd: docId});
  },

  getNick: function() {
    if(NucleusUser.me() && this._id === NucleusUser.me()._id) return "Me";
    return this.nick;
  },
  getCursor: function() {
    return this.cursor_pos;
  },
  setCursor: function(row, col) {
    this.update({cursor_pos: [row, col]});
  },

  getColor: function() {
    return this.color;
  },

  getCurrentFilepath: function() {
    return this.currentFilepath || '*scratch*';
  },
  setCurrentFilepath: function(filepath) {
    this.update({currentFilepath: filepath});
  },

  toggleEventSync: function(app, shouldRecieve) {
    /**
     * Toggle events for the `app`, or sets it to `shouldRecieve` if given.
     *
     * Arguments:
     * * `app` *{String}*: App for which to toggle events. Could be `app` (the app window) or `nucleus` (the nucleus editor window)
     * * `shouldRecieve` *{Boolean}*: If provided, sets the event sync status to this instead of toggling it
     */

    app = app || "app";

    var is_syncing_events = shouldRecieve || app === "app" ? !this.syncing_app_events : !this.syncing_nucleus_events;

    if(app === "app")
      this.update({syncing_app_events: is_syncing_events});
    else
      this.update({syncing_nucleus_events: is_syncing_events});

    if (is_syncing_events) {
      NucleusClient.getWindow(app).eval("NucleusEventManager.initialize()");
    }
    else {
      NucleusClient.getWindow(app).eval("NucleusEventManager.tearDown()");
    }

  },

  isSyncingEvents: function(app) {
    app = app || "app";
    return app === "app" ? this.syncing_app_events : this.syncing_nucleus_events;
  },

  delete: function() {
    /**
     * Deletes the user. It would work and should be used only on client since Session or cookie won't be available on server.
     */

    NucleusUsers.remove({_id: this._id});
    if (Meteor.isServer) {
      return;
    }
    $.cookie("nucleus_user", null);
    Session.set("nucleus_user", null);
  },

  sendChat: function(message) {
    /**
     * Broadcast chat message from this user. Group chat is the only kind of chat supported in Nucleus.
     */

    var nick = this.nick;
    var chat = new ChatMessage();
    chat.broadcast(nick, message);
  }
});

NucleusUser.me = function() {
  /**
   * Get currently logged in user.
   */

  if(Meteor.isServer) throw new Error("Client only method");
  var nucUserId = Session.get('nucleus_user') || $.cookie("nucleus_user");

  return NucleusUsers.findOne(nucUserId);
};

NucleusUser.new = function(nick) {
  /**
   * Create new user. Creating new nucleus user involve setting session var and a cookie. Either one of these would work, access to current user is always through `Nucleususer.me()` so it shouldn't be a problem when we change the user creation to a proper auth system.
   *
   * This should always be the method used for creating new `NucleusUser`s
   */

  var existingUser = NucleusUsers.findOne({nick: nick});
  if (existingUser) return false;

  var newUser = new NucleusUser();
  newUser.nick = nick;
  newUser.setCwd(NucleusClient.getScratchDoc());
  newUser.color = Utils.getRandomColor();
  newUser.save();

  $.cookie("nucleus_user", newUser._id);
  Session.set("nucleus_user", newUser._id);
  return newUser;
};
