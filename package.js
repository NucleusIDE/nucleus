Package.describe({
    summary: "Realtime collaborative development for the web"
});

Npm.depends({
    share: "0.6.3"
});

Package.on_use(function (api, where) {
    api.use(['jquery', 'deps', 'templating', 'underscore', 'session','stupid-models', 'meteor-sharejs', 'flash-messages', 'meteor-live-update']);

    api.add_files([
        'both/nucleus.js',
        'both/models/nucleus_user.js'
    ], ['client', 'server']);

    api.add_files([
        'client/lib/cookie.js',
        'client/nucleus.js',
        'client/template.html',
        'client/template.css',
        'client/template.js',
        'client/events.js',
        // 'client/lib/jstree.js',
        // 'client/lib/themes/default/style.css',
        // 'client/lib/themes/default/32px.png',
        // 'client/lib/themes/default/40px.png',
        // 'client/lib/themes/default/throbber.gif',
    ], ['client']);
    api.add_files([
        'server/nucleus.js',
        'server/methods.js',
    ], ['server']);

    api.export && api.export(['NucleusUser'], ['server', 'client']);
    api.export && api.export(['Nucleus'], ['server']);
    api.export && api.export(['NucleusClient'], ['client']);
});
