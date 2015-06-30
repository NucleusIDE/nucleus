/*global Files, NucleusEventSync, PluginManager */

var fileTree,
    nucleusClientDep = new Deps.Dependency();

var UltimateIDEFactory = function () {
  this.config = {
    nucleusUrl: window.location.origin + '/nucleus',
    windowName: 'Nucleus',
    serverDir: 'server',
    suckCSSFromPackages: []
  };

  this.Files = new Files();
  this.EventSync = new NucleusEventSync(this);
  //use this plugin manager and remove the old plugin manager from this.initialize
  this.Plugins = PluginManager;
  return this;
};

UltimateIDEFactory.prototype.initialize = function (config, nucleusWindow) {
  this.configure(config);

  //Configure flash messages. We are using `mrt:flash-messages` package for flash messages
  FlashMessages.configure({
    autoHide: true,
    hideDelay: 5000,
    autoScroll: true
  });

  this.nucleusWindow = nucleusWindow;

  //let's override nucleusWindow's LiveUpdate.refresh so it won't re-render the editor page
  var nucOverrideInterval = Meteor.setInterval(function () {
    if (nucleusWindow.Meteor && nucleusWindow.LiveUpdate) {
      //        this.origLiveUpdateRefreshFile = this.getWindow('app').LiveUpdate.refreshFile;
      nucleusWindow.LiveUpdate.refreshFile = function () {
        return false;
      };
      Meteor.clearInterval(nucOverrideInterval);
    }
  }, 500);

  this.Editor = NucleusEditor;

  /**
   * Add Plugin manager to Nucleus and put 'registerPlugin' on this for convinience
   */
  this.PluginManager = new NucleusPluginManager(this);
  this.registerPlugin = this.PluginManager.registerPlugin.bind(this.PluginManager);

  /**
   * Let's keep the current user on NucleusClient, and use NucleusUser as just a way of handling users. Not as an interface
   */
  this.currentUser = new ReactiveVar(null);

  this.Deploy = new DeployManager();

  return false;
};

UltimateIDEFactory.prototype.configure = function (config) {
  _.extend(this.config, config);
};

UltimateIDEFactory.prototype.popup = function() {
  //url where nucleus template is expected
  var url = this.config.nucleusUrl,
      //name of Nucleus window. Not significant
      windowName = this.config.windowName;
  //nucleus window which has nucleus editor.
  this.nucleusWindow = window.open(url, windowName, 'height=550,width=900');
  if (window.focus) {
    this.nucleusWindow.focus();
  }

  return this.nucleusWindow;
};

/**
 * Get name of the the *scratch* doc. This is the document which is opened in ace when user has just logged in and haven't yet opened any document.
 */
UltimateIDEFactory.prototype.getScratchDoc = function () {
  return 'scratch';
};

/**
 * Get the window for `app_name`. If `app_name` is not given, it returns window for `nucleus`
 *
 * *Attributes*:
 * * `app_name` *{String}* : Can be **app** or **nucleus**
 */
UltimateIDEFactory.prototype.getWindow = function (appName) {
  var nucleusWindow = this.nucleusWindow ? this.nucleusWindow : window.name === "Nucleus" ? window : window;

  if (appName === 'app') return nucleusWindow.opener ? nucleusWindow.opener : nucleusWindow;

  return nucleusWindow;
};

/**
 * Get `app` window
 */
UltimateIDEFactory.prototype.getAppWindow = function () {
  return window.name === "Nucleus" ? window.opener : window;
};

/**
 * Get all online users. All users in `NucleusUsers` collection are online users since we remove any user who leaves the nucleus as soon as they leave it.
 */
UltimateIDEFactory.prototype.getOnlineUsers = function () {
  return NucleusUsers.find({status: 3});
};

UltimateIDE = new UltimateIDEFactory();

// Ultimate('UltimateIDE').extends(UltimateClass, {});
// Ultimate('_UltimateIDE').extends(UltimateClass);
// _UltimateIDE.extendClient((new _UltimateIDE()));

// UltimateIDE = new _UltimateIDE();
