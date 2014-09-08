/**
 * _id                          MONGO ID
 * nick                         STRING (Nickname)
 * cwd                          MONGO ID (Current Working Document)
 * current_filepath                     String
 * color                        STRING
 * cursor_pos                   ARRAY [row, col]
 * syncing_nucleus_events       BOOLEAN
 * syncing_app_events       BOOLEAN
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
    app = app || "app";

    var is_syncing_events = shouldRecieve || app === "app" ? !this.syncing_app_events : !this.syncing_nucleus_events;

    if (is_syncing_events) {
      NucleusClient.getWindow(app).eval("NucleusEventManager.initialize()");
    }
    else NucleusClient.getAppWindow(app).eval("NucleusEventManager.tearDown()");

    if(app === "app")
      this.update({syncing_app_events: is_syncing_events});
    else
      this.update({syncing_nucleus_events: is_syncing_events});
  },

  isSyncingEvents: function(app) {
    app = app || "app";
    return app === "app" ? this.syncing_app_events : this.syncing_nucleus_events;
  },

  delete: function() {
    NucleusUsers.remove({_id: this._id});
    $.cookie("nucleus_user", null);
    Session.set("nucleus_user", null);
  },

  sendChat: function(message) {
    var nick = this.nick;
    var chat = new ChatMessage();
    chat.broadcast(nick, message);
  }
});

NucleusUser.me = function() {
  if(Meteor.isServer) throw new Error("Client only method");
  var nucUserId = Session.get('nucleus_user') || $.cookie("nucleus_user");

  return NucleusUsers.findOne(nucUserId);
};

NucleusUser.new = function(nick) {
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
