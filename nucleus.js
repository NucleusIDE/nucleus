//Gotta change ace's paths as below to prevent those worker errors in console and to include ace's extra files as assets instead of bundling them all with the app
// ace.config.set("workerPath", "/packages/sharejs/ace-builds/src");

//overriding Meteor.Collection.prototype.insert to avoid duplicate inserts
var originalInsert = Meteor.Collection.prototype.insert;
Meteor.Collection.prototype.insert = function() {
    //let's not re-insert the doc if it's because of the event being synced
    if(NucleusEventManager.isProcessingEvent()) return;

    var args = new Array(arguments.length);
    var ctx = this;

    for(var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
    }
    originalInsert.apply(ctx, args);
};
