Package.describe({
    summary: "Realtime collaborative development for the web"
});

Npm.depends({
    share: "0.6.3"
});

Package.on_use(function (api, where) {
    api.use(['jquery', 'deps', 'templating', 'underscore', 'session', 'moment', 'stupid-models', 'meteor-sharejs', 'flash-messages', 'meteor-live-update']);

    api.add_files([
        'nucleus.js'
    ], 'client');

    api.add_files([
        'both/utilities.js',
        'both/nucleus.js',
        'both/models/nucleus_user.js',
        'both/models/nucleus_event_model.js'
    ], ['client', 'server']);

    api.add_files([
        'client/lib/cookie.js',
        'client/lib/jstree/jstree.js',
        'client/lib/jstree/themes/default/style.css',
        // 'client/lib/tooltipster/jquery.tooltipster.js',
        // 'client/lib/tooltipster/tooltipster.css',
        // 'client/lib/tooltipster/tooltipster-light.css',

        'client/nucleus.js',
        'client/nucleus_editor.js',
        'client/nucleus_sidebar.js',

        'client/hint.css',
        'client/template.css',
        'client/template.html',
        'client/template.js',

        'client/eventsync/nucleus_event_manager.js',
        'client/eventsync/utils.js',
        'client/eventsync/clicks.js',
    ], ['client']);

    api.add_files([
        'client/lib/jstree/themes/default/32px.png',
        'client/lib/jstree/themes/default/40px.png',
        'client/lib/jstree/themes/default/throbber.gif',
    ], 'client', {isAsset: true});

    api.add_files([
        'server/nucleus.js',
        'server/methods.js',
    ], ['server']);

    api.export && api.export(['NucleusUser'], ['server', 'client']);
    api.export && api.export(['Nucleus'], ['server']);
    api.export && api.export(['NucleusClient', 'NucleusEditor', 'NucleusEventManager'], ['client']);
});
