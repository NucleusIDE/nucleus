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


/**
 It defines `Nucleus` on server and provide all needed methods for interacting with the filesystem on server like getting cloning the git url, saving file, getting file  contents for editing etc. Most of the methods here are synchronous. I don't exactly remember what the issue was for which I chose synchronous over async. My initial approach was to use async flow in here, but I opted for sync shortly after starting.
 */
NucleusFactory = function() {
  var homeDir = process.env.HOME,
      nucleusDir = path.join(homeDir, ".nucleus");

  this.config = {
    git: '',
    project: '',
    preventAppCrashes: true
  };

  this.getFileExtension = function (filepath) {
    return path.extname(filepath).replace(".", "");
  };


  // Configure Nucleus on server. Following options are accepted for configuration:
  // * git :     Remote git url
  // * project:  Name of the project. A folder with this name is created in `Nucleus.config.projectDir` ('~/.nucleus') and `Nucleus.config.git` url is cloned in it.
  // It also sets the `Nucleus.config.projectDir` which is not configurable by user.

  this.configure = function(config) {
    _.extend(Nucleus.config, config);

  Nucleus.config.projectDir = process.env.PWD;

  var pathParts = process.env.PWD.split('/');
  Nucleus.config.project = pathParts[pathParts.length - 1];

  console.log('Project DIR: ' + Nucleus.config.projectDir);
  //Nucleus.config.projectDir = path.join(homeDir, ".nucleus/",Nucleus.config.project);
  };

  //This method is called on nucleus initialization on the server (in the app).
  this.initialize = function(config) {
    config && this.configure(config);
    //this.nucleusCloneRepo();
    if(this.config.preventAppCrashes)
      CrashWatcher.initialize();
    NucleusGit = new Git(this.config);
  };

  //This function returns the file-tree of the project. It produces JSON representation of the directory-structure of the `Nucleus.config.projectDir`
  //Accepts an object `options` as argument. `options` can have following properties:
  // * rootDir - directory which should be converted to JSON
  // * parent - parent node for the first node in JSON produced. In jstree, `#` represents root node
  // * traverseSymlinks - shall we traverse symlinks?
  // * includeHidden - shall we include hidden files in the produced tree? (hidden files/directories are those whose name start with `.`)
  this.getDirTree = function(options) {
    options = options || {};
    var  dirTree= function (options) {
      var filename = options.rootDir || Nucleus.config.projectDir,
          parent = options.parent || "#",
          traverseSymlinks = options.traverseSymlinks || false,
          includeHidden = options.includeHidden || false,

          stats = fs.lstatSync(filename),
          projectDir = Nucleus.config.projectDir,
          info = {
            path: filename,
            parent: parent,
            name: path.basename(filename)
          };

      if(! includeHidden && info.name.indexOf(".") === 0)
        return;

      if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
          return dirTree({rootDir: filename + '/' + child, parent: filename, traverseSymlinks: traverseSymlinks, includeHidden: includeHidden});
        });
      } else if ( stats.isSymbolicLink()) {
        info.type = "symlink";
        //below is for traversing symlinks (packages etc)
        if(traverseSymlinks) {
          var link = fs.readlinkSync(filename);
          if (link.indexOf(".") === 0) return;

          if(fs.lstatSync(link).isDirectory()) {
            info.children = fs.readdirSync(link).map(function(child) {
              return dirTree({rootDir: filename + '/' + child, parent: filename, traverseSymlinks: traverseSymlinks, includeHidden: includeHidden});
            });
          }
        }
      } else {
        info.type = "file";
      }
      return info;
    };

    var removeEmptyChildren = function(tree) {
      tree.children = _.compact(tree.children);
      _.each(tree.children, removeEmptyChildren);
    };


    var tree = dirTree(options);
    if (! options.includeHidden) {
      //Double check for hidden files.
      removeEmptyChildren(tree);
    }
    return tree;
  };

  //Get the contents of a single file.
  // * **filepath** - absolute path of the file whose contents are required
  //
  //*filepath* can be `*scratch*`. `*scratch*` in nucleus represents the limbo in the ace editor when user has just logged in and have no file opened. Emacs has a `*scratch*` buffer, so you know.
  this.getFileContents = function(filepath) {
    if (filepath === '*scratch*') return false;

    if (typeof filepath !== 'string' || fs.lstatSync(filepath).isDirectory()) {
      console.log("FILE PATH TYPE", typeof filepath);
      return false;
    }

    var contents = fs.readFileSync(filepath, 'utf-8');
    return contents;
  };


  //`git pull` changes from the remote git. These git methods are used behind the git UI in nucleus. I am in favor of using a terminal based UI instead of buttons.
  // Button based git flow is holy-grail of unknown errors that might occur in the app
  //
  //All the git methods assume `master` to be the branch and `origin` to be the remote. These need to be made configurable configurable in future when we'll aim for anonymous users of the app to make changes. My idea is that anonymous users could change the app and when they push the changes, those changes will be saved in a new git repo in user's github, or in a different branch in app owner's github.
  //
  //Returns
  // * `0` - No new changes created by function
  // * `1` - Pulled new changes
  // * `-1` - Error occured
  this.pullChanges = function(projectDir) {
    projectDir = projectDir || this.config.projectDir;
    var fut = new Future();
    child.exec("cd " + projectDir + " && git pull origin master", function(err, stdout, stderr) {
      if (err) {console.log(err); fut.return(-1); }
      else {
        if(stdout.search(/Already up-to-date/) >= 0)
          fut.return(0);
        else
          fut.return(1);

        console.log("STDOUT:", stdout);
        console.log("STDERR", stderr);
      }
    });
    return fut.wait();
  };

  // Push new  changes to `master` branch of `origin` remote in `Nucleus.config.projectDir`.
  //Returns
  // * `0` - No new commits to push.
  // * `1` - Pushed new changes
  // * `-1` - Error occured
  this.pushChanges = function(projectDir) {
    projectDir = projectDir || this.config.projectDir;
    var fut = new Future();

    child.exec("cd " + projectDir + " && git push origin master", function(err, stdout, stderr) {
      if (err) {
        console.log(err);
        fut.return(-1);
      } else if (stderr.search(/Everything up-to-date/) >= 0)
        fut.return(0);
      else
        fut.return(1);

      console.log("STDOUT:", stdout, "STDERR:", stderr);
    });
    return fut.wait();
  };

  //Commit new  changes in `master` branch in `Nucleus.config.projectDir`.
  //
  //Accepts:
  // * **message** - commit message
  //
  //Returns
  // * `0` - No new changes to commit.
  // * `1` - Committed new changes with message `message`
  // * `-1` - Error occurred
  this.commitChanges = function(message) {
    var projectDir = this.config.projectDir;
    message = message || "Changes from nucleus.";
    var fut = new Future();

    child.exec('cd ' + projectDir + ' && git add . --all && git commit -m "' + message +'"', function(err, stdout, stderr) {
      if (err) {
        if (err.killed === false && err.code === 1 && err.signal === null) {
          fut.return(0);

        } else {
          console.log(err);
          fut.return(-1);
        }
      } else {
        console.log(stdout, stderr);
        fut.return(1);
      }
    });
    return fut.wait();
  };

  //Clone the `git` remote repo in `Nucleus.config.projectDir`. It won't attempt to clone the repo if `Nucleus.config.projectDir` already exists. If the `Nucleus.config.projectDir` already exists, it attempts to pull new changes instead.
  this.nucleusCloneRepo = function(git, project) {
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

  //This method is obsolete. We use this method to get the latest CSS from the filesystem, and manually push it into the app. But since we have started running meteor in dev mode on the nucleus server, it is no longer needed as meteor itself live-push all the CSS. Note that this method is faster than meteor's, but it won't load packages'
  this.getAllCSS = function(options) {
    var tree = this.getDirTree(),
        packagesToInclude = options && options.packagesToInclude,
        cssFiles = [],
        collectedCss = '';

    var collectCSSFiles = function(filetree) {
      if (filetree.name.indexOf(".") !== 0) {
        if (path.extname(filetree.path).replace(".", "") === 'css')
          cssFiles.push(filetree.path);

        _.each(filetree.children, function(node) {
          collectCSSFiles(node);
        });
      }
    };
    var collectCSSFilesFromPackages = function(packages) {
      packages = packages || [];
      _.each(packages, function(package) {
        var packageDir = path.join(this.config.projectDir, "packages/"+package);
        var tree = this.getDirTree({rootDir: packageDir, parent: "#", traverseSymlinks: true});
        collectCSSFiles(tree);
      }.bind(this));
    }.bind(this);

    collectCSSFilesFromPackages(packagesToInclude);
    collectCSSFiles(tree); //populates cssFiles with filepath of all CSS files

    //TODO: make this better and more meteor like
    _.each(cssFiles, function(cssfile) {
      var contents = this.getFileContents(cssfile);
      console.log("FETCHING : ", cssfile);
      collectedCss += contents;
    }.bind(this));


    return collectedCss;
  };

  //Let's keep mup deploy here until we have a clear/bigger deployment strategy
  this.mupDeploy = function(mup_setup) {
    var projectDir = this.config.projectDir;
    var fut = new Future();

    var commmand = "cd " + projectDir + (mup_setup ? " && mup setup " : "")  + " && mup deploy";

    child.exec(command, function(err, stdout, stderr) {
      if (err) {console.log(err); fut.return(-1); }
      else {
        fut.return(1);

        console.log("STDOUT:", stdout);
        console.log("STDERR", stderr);
      }
    });
    return fut.wait();
  };

  //Create a new file on the server
  //
  //Arguments:
  //* `filepath` {*string*} : Absolute or relative path of the file to be created. Relative to `Nucleus.config.projectDir`
  //* `directory` {*boolean*}: Is the file to be created a directory?
  this.createNewFile = function(filepath, directory) {
    //check whether the `filepath` is absolute or relative
    filepath = filepath.indexOf("/") === 0 ? filepath : this.config.projectDir + "/" + filepath;
    var fileName = path.basename(filepath);

    //If a file with `filename` is already present, rename it to a unique name.
    var renameUnique = function(filepath) {
      var count = 1;
      var newPath = filepath + "_" + count;

      while(fs.existsSync(newPath)) {
        newPath = filepath + "_" + count++;
      }

      return newPath;
    };

    if (fs.existsSync(filepath))
      filepath = renameUnique(filepath);

    if(!directory) {
      fs.openSync(filepath, 'w');
      return filepath;
    }

    fs.mkdirSync(filepath);
    return filepath;
  };

  //Delete the file at `filepath`
  //
  //Arguments:
  //`filepath` *{string}*
  //
  //If the file represented by `filepath` is a directory, it deletes the directory recursively.
  this.deleteFile = function(filepath) {
    if (!fs.existsSync(filepath)) {
      return true;
    }
    var stat = fs.statSync(filepath);

    var fut = new Future();

    if (stat.isDirectory())
      child.exec("rm -rf "+filepath, function(err, res) {
        fut.return(res);
      });
    else
      fut.return(fs.unlinkSync(filepath));

    return fut.wait();
  };

  //Rename `oldpath` to `newpath`
  this.renameFile = function(oldpath, newpath) {
    if (!fs.existsSync(oldpath)) {
      return false;;
    }

    return fs.renameSync(oldpath, newpath);
  };

};

//Publishes all the collections required by nucleus with no limits or checks
Meteor.publish("nucleusPublisher",function() {
  return [
    NucleusDocuments.find({}),
    ShareJsDocs.find({}),
    NucleusUsers.find({}),
    NucleusEvents.find({})
  ];
});

//Creat server side global `Nucleus` using the above constructor
Nucleus = new NucleusFactory();
