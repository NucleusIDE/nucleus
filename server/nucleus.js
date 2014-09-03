fs = Npm.require('fs'),
path = Npm.require('path'),
child = Npm.require('child_process'),
// ShareJs = Npm.require('share').server,
Future = Npm.require('fibers/Future');



NucleusFactory = function() {
    var homeDir = process.env.HOME,
        nucleusDir = path.join(homeDir, ".nucleus");

    this.config = {
        git: '',
        project: ''
    };

    this.getFileExtension = function (filepath) {
        return path.extname(filepath).replace(".", "");
    };

    this.configure = function(config) {
        _.extend(Nucleus.config, config);
        Nucleus.config.projectDir = path.join(homeDir, ".nucleus/",Nucleus.config.project);
    };

    this.initialize = function() {
        this.nucleusCloneRepo();
    };

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
            removeEmptyChildren(tree);
        }
        return tree;
    };

    this.getFileContents = function(filepath) {
        if (filepath === '*scratch*') return false;

        if (typeof filepath !== 'string' || fs.lstatSync(filepath).isDirectory()) {
            console.log("FILE PATH TYPE", typeof filepath);
            return false;
        }

        var fut = new Future();
        fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
            if (err) {
                console.log(err);
            }
            fut['return'](contents);
        });
        return fut.wait();
    };


    this.pullChanges = function(projectDir) {
        projectDir = projectDir || this.config.projectDir;
        var fut = new Future();
        child.exec("cd " + projectDir + " && git pull nucleus nucleus", function(err, stdout, stderr) {
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

    this.pushChanges = function(projectDir) {
        projectDir = projectDir || this.config.projectDir;
        var fut = new Future();

        child.exec("cd " + projectDir + " && git push nucleus nucleus", function(err, stdout, stderr) {
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

    this.commitChanges = function(message) {
        var projectDir = this.config.projectDir;
        message = message || "Changes from nucleus.";
        var fut = new Future();
        child.exec('cd ' + projectDir + ' && git add . --all && git commit -m "' + message +'"', function(err, stdout, stderr) {
            if (err) {
                if (err.killed === false && err.code === 1 && err.signal === null) {
                    //no changes to commit
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

    this.nucleusCloneRepo = function(git, project) {
        git = git || Nucleus.config.git;
        project = project || Nucleus.config.project;
        var projectDir = this.config.projectDir = path.join(homeDir, ".nucleus/",project);

        if (! git) return;

        var nucleusDirExists = fs.existsSync(nucleusDir);
        var repoAlreadyCloned = fs.existsSync(projectDir);

        if (!nucleusDirExists) fs.mkdirSync(path.join(homeDir, ".nucleus"));

        if (!repoAlreadyCloned) {
            child.exec("cd " + nucleusDir + " && git clone " + git + " " + project + " && cd " + project +" && git checkout -b nucleus  && git remote add nucleus " + git, function(err, stdout, stderr) {
                if (err) {console.log(err); return;}
                console.log(stdout, stderr);
            });
        }

        if (nucleusDirExists && repoAlreadyCloned)
            this.pullChanges(projectDir);
    };

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

    //let's keep mup deploy here until we have a clear/bigger deployment strategy
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

    this.createNewFile = function(filepath, directory) {
        filepath = filepath.indexOf("/") === 0 ? filepath : this.config.projectDir + "/" + filepath;
        var fileName = path.basename(filepath);

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

};

Meteor.publish("nucleusPublisher",function() {
    return [
        NucleusDocuments.find({}),
        ShareJsDocs.find({}),
        NucleusUsers.find({}),
        NucleusEvents.find({})
    ];
});


Nucleus = new NucleusFactory();
