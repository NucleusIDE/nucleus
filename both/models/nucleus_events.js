/**
 * event_name                   String
 * event_target                 String
 * users_done                   mongo_id
 * users_ignored                mongo_id
 * originator                   mongo_id (user who triggered the event in first place)
 */

NucleusEvents = new Meteor.Collection('nucleus_events');
NucleusEvent = Model(NucleusEvents);

NucleusEvent.extend({
    send: function() {
        console.log("TODO: ");
    },
    trigger: function() {
        console.log("TODO: ");
    }
});
