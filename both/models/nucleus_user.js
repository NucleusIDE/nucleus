/**
 * _id                          MONGO ID
 * nick                         STRING (Nickname)
 * cwd                          MONGO ID (Current Working Document)
 * current_filepath                     String
 * color                        STRING
 */

NucleusUsers = new Meteor.Collection('nucleus_users');
NucleusUser = Model(NucleusUsers);

NucleusUser.extend({
    getCwd: function() {
        return this.cwd;
    },
    getNick: function() {
        return this.nick;
    },
    getColor: function() {
        return this.color;
    },
    getCurrentFilepath: function() {
        return this.currentFilepath;
    },

    setCwd: function(docId) {
        this.update({cwd: docId});
    },
    setCurrentFilepath: function(filepath) {
        this.update({currentFilepath: filepath});
    },
    delete: function() {
        NucleusUsers.remove({_id: this._id});
        Session.set("nucleus_user", null);
    }
});

NucleusUser.me = function() {
    var nucUserId = Session.get("nucleus_user");
    return NucleusUsers.findOne(nucUserId);
};

NucleusUser.new = function(nick) {
    var existingUser = NucleusUsers.findOne({nick: nick});
    if (existingUser) return false;

    var newUser = new NucleusUser();
    newUser.nick = nick;
    newUser.cwd = NucleusClient.getScratchDoc();
    newUser.color = Utils.getRandomColor();
    newUser.save();

    Session.set("nucleus_user", newUser._id);
    return newUser;
};
