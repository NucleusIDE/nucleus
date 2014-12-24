Package.describe({
  summary: "Realtime collaborative development for the web",
  version: "0.1.2",
  name: "channikhabra:nucleus",
  git: 'https://github.com/channikhabra/meteor-nucleus'
});

Npm.depends({
  'fibers': '1.0.2',
  'nuc-watch-meteor': 'https://github.com/channikhabra/nuc-watch-meteor/archive/0f3f2d5ebd1231582f5c7bc966fabb3bf30c27c0.tar.gz'
});

Package.on_use(function (api, where) {
  api.versionsFrom("METEOR@0.9.1");
  api.use(['ui', 'spacebars','blaze', 'jquery', 'deps', 'templating', 'underscore', 'session',
           'mrt:moment@2.8.1',
           'channikhabra:stupid-models@0.0.3',
           'channikhabra:live-update@0.1.0',
           'mizzao:sharejs@0.6.1',
           'channikhabra:terminal@0.1.1',
           'mrt:flash-messages@0.2.4']);

  api.add_files([
    'public/logo.png',
  ], 'client', {isAsset: true});

  api.add_files([
    'global_overrides.js'
  ], 'client');

  api.add_files([
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

    'client/nucleus_client.js',
    'client/nucleus_editor.js',
    'client/nucleus_sidebar.js',

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
    'server/crash_watcher.js',
    'server/nucleus.js',
    'server/methods.js',
    'chat/server/publishers.js',
  ], ['server']);

  api.export && api.export(['NucleusUser'], ['server', 'client']);
  api.export && api.export(['Nucleus'], ['server']);
  api.export && api.export(['NucleusClient', 'NucleusEditor', 'NucleusEventManager'], ['client']);
});
