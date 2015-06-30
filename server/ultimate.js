/*global PluginManager, Files */

Meteor.startup(function() {
  UltimateIDE.initialize({
    preventAppCrashes: false
  });
});

var fs = Npm.require('fs'),
    path = Npm.require('path'),
    child = Npm.require('child_process');

var homeDir = process.env.HOME,
    nucleusDir = path.join(homeDir, '.nucleus');

var UltimateIDEFactory = function() {
  var self = this;

  this.config = {
    git: '',
    project: '',
    preventAppCrashes: true,
    terminalInitialized: false,
    user: null,
    password: null
  };

  this.Terminal = {};
  this.Terminal.configure = function(options) {
    var terminalUsername = options.user,
        terminalPassword = options.password;

    if (!terminalUsername || ! terminalPassword) {
      self.config.terminalInitialized = false;
      return;
    }

    //Setup terminal. Terminal starts a different server protected by username and password given below.
    NucleusTerminal.initialize({
      username: terminalUsername,
      password: terminalPassword
    });

    self.config.terminalInitialized = true;
  };

  //TODO: keep this Plugin manager and remove the one in this.initialize
  this.Plugins = PluginManager;
  this.Files = new Files(this);
};

UltimateIDEFactory.prototype.initialize = function(config) {
  /**
   * This method is called on nucleus initialization on the server (in the app).
   */

  config && this.configure(config);

  //this.nucleusCloneRepo();
  this.Deploy = new DeployManager();

  /**
   * Add Plugin manager to Nucleus and put 'registerPlugin' on this for convinience
   */
  this.PluginManager = new NucleusPluginManager(this);
  this.registerPlugin = this.PluginManager.registerPlugin.bind(this.PluginManager);

  if(this.config.preventAppCrashes)
    CrashWatcher.initialize();

  this.Files.updateFileTreeCollection();
};

UltimateIDEFactory.prototype.configure = function(config) {
  /**
   * Configure Nucleus on server. Following options are accepted for configuration:
   * git :     Remote git url
   * project:  Name of the project
   */

  _.extend(this.config, config);

  this.config.projectDir = process.env.PWD;

  var pathParts = process.env.PWD.split('/');
  this.config.project = pathParts[pathParts.length - 1];
  //this.config.projectDir = path.join(homeDir, ".nucleus/",this.config.project);
};

UltimateIDEFactory.prototype.nucleusCloneRepo = function(git, project) {
  /**
   * Clone the `git` remote repo in `Ultimate.config.projectDir`.
   * It won't attempt to clone the repo if `Ultimate.config.projectDir` already exists.
   * If the `Ultimate.config.projectDir` already exists, it attempts to pull new
   * changes instead.
   */

  git = git || this.config.git;
  project = project || this.config.project;
  var projectDir = this.config.projectDir;

  if (!git) return;

  var nucleusDirExists = fs.existsSync(nucleusDir);
  var repoAlreadyCloned = fs.existsSync(projectDir);
  var command = "cd " + nucleusDir + " && git clone " + git + " " + project + " && cd " + project +" && git remote add nucleus " + git;

  if (!nucleusDirExists) fs.mkdirSync(path.join(homeDir, ".nucleus"));

  if (!repoAlreadyCloned) {
    child.exec(command, function(err, stdout, stderr) {
      if (err) {console.log(err); return;}
      console.log(stdout, stderr);
    });
  }

  if (nucleusDirExists && repoAlreadyCloned)
    //pulling new changes lose un-committed changes. So let's not pull changes for now
    return;
  //      this.pullChanges(projectDir);
};

//Creat server side global `Nucleus` using the above constructor
UltimateIDE = new UltimateIDEFactory();
