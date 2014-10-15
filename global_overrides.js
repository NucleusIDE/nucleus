/**
 * # Global Overrides
 * Override Meteor.Collection.prototype.insert to avoid duplicate inserts.
 *
 * This is done to avoid re-insertion of documents in database when we sync events across multiple clients.
 *
 * We over-ride Meteor.Collection.insert such that it will not insert the document if `NucleusEventManager.isProcessingEvent()` returns true.
 */
var originalInsert = Meteor.Collection.prototype.insert;
Meteor.Collection.prototype.insert = function() {
  if(NucleusEventManager.isProcessingEvent()) return false;

  var args = new Array(arguments.length);
  var ctx = this;

  for(var i = 0; i < args.length; ++i) {
    args[i] = arguments[i];
  }
  return originalInsert.apply(ctx, args);
};
