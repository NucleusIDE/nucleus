/**
 * #Permissions
 *
 * Most users have `insecure` package removed, so we have to provide `allow` rules for collections we explicitly create.
 */


ShareJsDocs.allow({
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


ShareJsOps.allow({
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


NucleusUsers.allow({
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
