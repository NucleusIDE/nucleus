Meteor.publish("chats", function(limit) {
    limit = limit || 100;
    return ChatMessages.find({}, {limit: limit});
});
