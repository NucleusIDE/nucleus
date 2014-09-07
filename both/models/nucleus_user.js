/**
 * _id                          MONGO ID
 * nick                         STRING (Nickname)
 * cwd                          MONGO ID (Current Working Document)
 * current_filepath                     String
 * color                        STRING
 * cursor_pos                   ARRAY [row, col]
 * receive_events               Boolean
 * event_recieving_app          String (app which receives events)
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

    var event_recieving_app = app,
        other_app = app === "app" ? "nucleus" : "app";

    var isRecievingEvents = this.recieve_events;
    var recieveEvents = (this.event_recieving_app === event_recieving_app) && isRecievingEvents ? false : true;

    if (recieveEvents) {
      NucleusClient.getWindow(event_recieving_app).eval("NucleusEventManager.initialize()");
    }
    else NucleusClient.getAppWindow(other_app).eval("NucleusEventManager.tearDown()");

    this.update({recieve_events: recieveEvents, event_recieving_app: event_recieving_app});
    console.log("SYNC EVENTS ON", event_recieving_app,"?",recieveEvents);
  },
  isSyncingEvents: function(app) {
    return this.recieve_events && this.event_recieving_app === app;
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
