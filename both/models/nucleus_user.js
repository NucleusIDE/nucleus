/**
 * _id                          MONGO ID
 * nick                         STRING (Nickname)
 * cwd                          MONGO ID (Current Working Document)
 */

NucleusUsers = new Meteor.Collection('nucleus_users');
NucleusUser = Model(NucleusUsers);

NucleusUser.extend({
    changeCwd: function(docId) {
        this.update({cwd: docId});
    },
    getCwd: function() {
        return this.cwd;
    },
    getNick: function() {
        return this.nick;
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
    newUser.save();

    Session.set("nucleus_user", newUser._id);
    return newUser;
};
