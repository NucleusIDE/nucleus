Package.describe({
  summary: "Realtime Collaborative IDE for Meteor",
  version: "0.1.12",
  name: "nucleuside:nucleus",
  git: 'https://github.com/nucleuside/nucleus'
});


Npm.depends({
  'fibers': '1.0.2',
  'nucleus-watch-meteor': 'https://github.com/NucleusIDE/nucleus-watch-meteor/archive/f3716eaa97ef7fbe6959f216d5d6490b29667f7c.tar.gz'
});

Package.on_use(function (api, where) {
  api.versionsFrom("METEOR@0.9.1");
  api.use(['ui', 'spacebars','blaze', 'jquery', 'deps', 'templating', 'underscore', 'session',
           'mrt:moment@2.8.1',
           'nucleuside:smart-models@0.0.6',
           'nucleuside:live-update@0.1.1',
           'mizzao:sharejs@0.6.1',
           'nucleuside:terminal@0.1.0',
           'mrt:flash-messages@0.2.4',
           'iron:router@0.9.0 || 1.0.0']);

  api.add_files([
    'public/logo.png',
  ], 'client', {isAsset: true});

  api.add_files([
    'global_overrides.js'
  ], 'client');

  api.add_files([
    'both/nucleus_global.js',
    'both/utilities.js',
    'both/collections.js',
    'chat/both/chat_model.js',
    'both/models/nucleus_user.js',
    'both/models/nucleus_event_model.js',
  ], ['client', 'server']);

  api.add_files([
    'client/lib/cookie.js',
    'client/lib/jstree/jstree.js',
    'client/lib/jstree/themes/default/style.css',

    'client/lib/font-awesome/css/font-awesome.css',
    'client/lib/hint.css',

    'client/plugin-manager.js',

    'client/nucleus_client.js',
    'client/nucleus_editor.js',
    'client/nucleus_sidebar.js',
    'client/keepalive.js',

    'client/template.css',
    'client/template.html',
    'client/template.js',

    'client/eventsync/nucleus_event_manager.js',
    'client/eventsync/utils.js',
    'client/eventsync/clicks.js',
    'client/eventsync/scroll.js',

    'client/eventsync/forms.js',
    'client/eventsync/form_inputs.js',
    'client/eventsync/form_toggles.js',
    'client/eventsync/form_submit.js',

    'client/eventsync/location.js',
    'client/eventsync/login.js',

    'chat/client/subscriptions.js'
  ], ['client']);

  api.add_files([
    'client/lib/jstree/themes/default/32px.png',
    'client/lib/jstree/themes/default/40px.png',
    'client/lib/jstree/themes/default/throbber.gif',

    'client/lib/font-awesome/fonts/FontAwesome.otf',
    'client/lib/font-awesome/fonts/fontawesome-webfont.woff',
    'client/lib/font-awesome/fonts/fontawesome-webfont.ttf',
    'client/lib/font-awesome/fonts/fontawesome-webfont.svg',
    'client/lib/font-awesome/fonts/fontawesome-webfont.eot',
  ], 'client', {isAsset: true});

  api.add_files([
    'server/git_operations.js',
    'server/crash_watcher.js',
    'server/nucleus.js',
    'server/methods.js',
    'server/keepalive.js',
    'server/permissions.js',
    'chat/server/publishers.js'
  ], ['server']);

  api.export && api.export(['NucleusUser', 'NucleusGlobal'], ['server', 'client']);
  api.export && api.export(['Nucleus', 'NucleusGit'], ['server']);
  api.export && api.export(['NucleusClient', 'NucleusEditor', 'NucleusEventManager', 'LiveUpdate'], ['client']);
});
