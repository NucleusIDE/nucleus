/**
 * # Nucleus
 */

Meteor.startup(function() {
  Nucleus.initialize({
    preventAppCrashes: false
  });
});

fs = Npm.require('fs'),
path = Npm.require('path'),
child = Npm.require('child_process'),
Future = Npm.require('fibers/future');

var NucleusFactory = function() {
  /**
   * It defines `Nucleus` on server and provide all needed methods for interacting with the
   * filesystem on server like getting cloning the git url, saving file, getting file
   * contents for editing etc. Most of the methods here are synchronous. I don't exactly
   * remember what the issue was for which I chose synchronous over async. My initial
   * approach was to use async flow in here, but I opted for sync shortly after starting.
   */

  var homeDir = process.env.HOME,
      nucleusDir = path.join(homeDir, ".nucleus"),
      self = this;

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

  this.configure = function(config) {
    /**
     * Configure Nucleus on server. Following options are accepted for configuration:
     * git :     Remote git url
     * project:  Name of the project
     */

    _.extend(Nucleus.config, config);

    Nucleus.config.projectDir = process.env.PWD;

    var pathParts = process.env.PWD.split('/');
    Nucleus.config.project = pathParts[pathParts.length - 1];
    //Nucleus.config.projectDir = path.join(homeDir, ".nucleus/",Nucleus.config.project);
  };

  this.initialize = function(config) {
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
  };

  var getTopmostGitDir = function(filepath) {
    var dir = this.config.projectDir;

    var getPackageDir = function(filepath) {
      var tempDir = path.dirname(filepath);
      if (path.basename(path.dirname(tempDir)) == 'packages') {
        return tempDir;
      } else {
        tempDir = path.dirname(tempDir);
        return getPackageDir(tempDir);
      }
    };

    if (/packages/.test(filepath)) {
      var packageDir = getPackageDir(filepath);
      if (NucleusGit.isGitRepo(packageDir)) {
        dir = packageDir;
      }
    }

    return dir;
  }.bind(this);

  this.pullChanges = function(selectedFile) {
    /**
     * `git pull` changes from the remote git. These git methods are used behind the git
     * UI in nucleus. I am in favor of using a terminal based UI instead of buttons.
     * Button based git flow is holy-grail of unknown errors that might occur in the app
     *
     * All the git methods assume `master` to be the branch and `origin` to be the remote.
     * These need to be made configurable configurable in future when we'll aim for
     * anonymous users of the app to make changes. My idea is that anonymous users could
     * change the app and when they push the changes, those changes will be saved in a new
     * git repo in user's github, or in a different branch in app owner's github.
     *
     * @Returns
     * `0` - No new changes created by function
     * `1` - Pulled new changes
     * `-1` - Error occured

     */

    var dir = getTopmostGitDir(selectedFile);
    return NucleusGit.pull(dir);
  };

  this.pushChanges = function(selectedFile, githubUser) {
    /**
     * Push new  changes to `master` branch of `origin` remote in
     * `Nucleus.config.projectDir`.
     *
     * Returns
     * `0` - No new commits to push.
     * `1` - Pushed new changes
     * `-1` - Error occured
     */
    var dir = getTopmostGitDir(selectedFile);
    return NucleusGit.push(dir, githubUser);
  };

  this.commitChanges = function(message, selectedFile, author) {
    /**
     * Commit new  changes in `master` branch in `Nucleus.config.projectDir`.
     * We use selectedFile to see if the file belongs to a package.
     * If it does, we try to make the commit for the package instead of the app itself
     *
     * Arguments
     * @message - commit message
     * @selectedFile  -  File presently selected in Nucleus
     *
     * Returns
     * `0` - No new changes to commit.
     * `1` - Committed new changes with message `message`
     * `-1` - Error occurred
     */

    var dir = getTopmostGitDir(selectedFile);
    return NucleusGit.commit(dir, message, author);
  };

  this.nucleusCloneRepo = function(git, project) {
    /**
     * Clone the `git` remote repo in `Nucleus.config.projectDir`.
     * It won't attempt to clone the repo if `Nucleus.config.projectDir` already exists.
     * If the `Nucleus.config.projectDir` already exists, it attempts to pull new
     * changes instead.
     */

    git = git || Nucleus.config.git;
    project = project || Nucleus.config.project;
    var projectDir = this.config.projectDir;

    if (! git) return;

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
};

//Creat server side global `Nucleus` using the above constructor
Nucleus = new NucleusFactory();
