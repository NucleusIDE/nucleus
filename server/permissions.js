/**
 * #Permissions
 *
 * Most users have `insecure` package removed, so we have to provide `allow` rules for collections we explicitly create.
 */


NucleusDocuments.allow({
    insert: function() {
        return true;
    },
    update: function() {
        return true;
    },
    remove: function() {
        return true;
    },
    fetch: [""]
});


NucleusEvents.allow({
    insert: function() {
        return true;
    },
    update: function() {
        return true;
    },
    remove: function() {
        return true;
    },
    fetch: [""]
});
