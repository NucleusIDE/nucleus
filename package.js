Package.describe({
  summary: "Realtime Collaborative IDE for Meteor",
  version: "0.2.0",
  name: "ultimateide:ultimate",
  git: 'https://github.com/nucleuside/nucleus'
});


Npm.depends({
  // 'fibers': '1.0.2',
  'github-oauth': '0.2.1',
  'mup': '0.9.7',
  'nucleus-watch-meteor': 'https://github.com/NucleusIDE/nucleus-watch-meteor/archive/fdabf2f83a586cda74a928bc37ec8f0f7fba26dd.tar.gz'
});

Package.on_use(function (api, where) {

  api.use(['ui', 'spacebars','blaze', 'jquery', 'deps', 'templating', 'underscore', 'session', 'http',
           'mrt:moment@2.8.1',
           'reactive-var',
           'reactive-dict',
           'kevohagan:ramda@0.13.0',
           'nucleuside:smart-models@0.0.8',
           // 'nucleuside:basic-auth@0.2.1',
           // 'nucleuside:simplewebrtc@0.0.1',
           'nucleuside:terminal@0.2.0',
           'nucleuside:eventsync@0.1.0',
           // 'aldeed:autoform@4.0.0',
           'nucleuside:live-update-plus@0.0.1',
           'nucleuside:nucleus-ui',
           'mizzao:sharejs@0.7.3',
           'mizzao:sharejs-ace@1.1.8_1',
           'mrt:flash-messages@0.2.4',
           'ultimateide:ultimate-mvc'
          ]);

  // we create /nucleus route only when iron:router is present. Otherwise we manually check the url
  api.use('iron:router@1.0.5', {weak: true});
  api.use('iron:router@1.0.5', 'server');

  api.imply([
    'reactive-var',
    'reactive-dict',
    'kevohagan:ramda@0.13.0'
  ]);

  api.add_files([
    'client/lib/global-state.js'
  ], 'client');

  //Add core nucleus plugin files
  //It is safe to put them here because these are actually executed only after NucleusClient is initialized
  //TODO: Move these plugins to new plugin system
  api.add_files([
    // 'client/plugins/NucleusClient.kbd.js',
    // 'client/plugins/master-prompt.js',
    // 'client/plugins/fuzzy-find-file.js',
    // 'client/plugins/nucleus-terminal.js',
  ], 'client');

  api.add_files([
    'public/logo.png',
  ], 'client', {isAsset: true});

  api.add_files([
    'server/secret_keys.js'
  ], 'server');

  api.add_files([
    'plugins/plugin-manager/plugin_manager.js',
    'both/master_config.js',
    'both/nucleus_global.js',
    'both/plugin-manager.js',
    'both/deploy.js',
    'both/utilities.js',
    'both/collections.js',
    'chat/both/chat_model.js',
    'both/models/nucleus_user.js',
  ], ['client', 'server']);

  api.add_files([
    'client/lib/cookie.js',
    'client/lib/hint.css',

    'client/nucleus_editor.js',
    'client/event-sync.js',
    'client/files.js',
    'client/ultimate.js',
    'client/nucleus_sidebar.js',
    'client/keepalive.js',
    'client/routes.js',

    'chat/client/subscriptions.js'
  ], ['client']);

  api.add_files([
    'server/publishers.js',
    'server/login-routes.js',
    'server/crash_watcher.js',
    'server/files.js',
    'server/ultimate.js',
    'server/git.js',
    'server/methods.js',
    'server/keepalive.js',
    'server/permissions.js',
    'chat/server/publishers.js'
  ], ['server']);

  api.add_files([
    'client/ui/workarea.js',

    'client/ui/editor/editor.html',
    'client/ui/editor/editor.js',
    'client/ui/editor/editor.css',
  ], 'client');

  /**
   * Client only components of plugin manager that must be loaded after Template
   * is present
   */
  api.add_files([
    'plugins/plugin-manager/views.js',
    'plugins/plugin-manager/views/activitybar.js',
  ], 'client');

  /**
   * New plugins must be loaded at the end of all files since they use Ultimate global.
   * These plugins are loaded at both client and server, the PluginManager decides whether
   * the code is to be ran on client or server based on plugin's config
   */
  api.add_files([
    'plugins/explorer/explorer.js',
    'plugins/explorer/views/explorer.html',
    'plugins/explorer/views/explore.js',
    'plugins/explorer/views/project-explorer.js',
    'plugins/explorer/views/working-files-explorer.js',
  ], 'client');

  api.export && api.export(['NucleusUser', 'NucleusGlobal'], ['server', 'client']);
  api.export && api.export(['UltimateIDE', 'NucleusGit'], ['server']);
  api.export && api.export(['UltimateIDE', 'NucleusEditor', 'LiveUpdate'], ['client']);
});
