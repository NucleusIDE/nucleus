/**
 * # ChatMessage
 * ## Attributes
 * * sender_name :                          STRING
 * * message :                              STRING
 * * sent_at :                              UNIX TIMESTAMP
 *
 */

ChatMessages = new Meteor.Collection('chats');

ChatMessage = Model(ChatMessages);

ChatMessage.extend({
  chat_broadcast: function(sender_name, message) {
    /**
     * Because a small bug in `channikhabra:stupid-models` it was not possible to override `this.save()`. Besides, `ChatMessage.broadcast()` is more intuitive than `ChatMessage.save()`.
     */

    this.sender_name = sender_name;
    this.message = message;
    this.sent_at = moment().toDate().getTime();

    console.log("SENDING", this);

    this.save();
  }
});

NucleusGlobal.ChatMessage = ChatMessage;
