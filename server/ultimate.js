/*global PluginManager, Files, Git */

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

  this.Plugins = PluginManager;

  var filesObj = new Files(this);
  var ServerFiles = Ultimate('UltimateServerFiles').extends(UltimateClass, filesObj);

  ServerFiles.extendHttp(filesObj);

  this.Files = new ServerFiles();

  this.git = new Git();
};

UltimateIDEFactory.prototype.initialize = function(config) {
  config && this.configure(config);
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
