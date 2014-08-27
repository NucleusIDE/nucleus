/**
 * sender_name                          String
 * message                              String
 * sent_at                              Unix Timestamp
 *
 */

ChatMessages = new Meteor.Collection('chats');

ChatMessage = Model(ChatMessages);

ChatMessage.extend({
    broadcast: function(sender_name, message) {
        this.sender_name = sender_name;
        this.message = message;
        this.sent_at = moment().toDate().getTime();
        this.save();
    }
});
