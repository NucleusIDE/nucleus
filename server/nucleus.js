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

    this.getFileContents = function(filepath) {
        if (filepath === '*scratch*') return false;

        if (typeof filepath !== 'string' || fs.lstatSync(filepath).isDirectory()) return false;

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
                if(stdout.search(/Already up-to-date/) >= 0) {
                    console.log(stdout, stderr);
                    fut.return(0);
                } else
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

    this.configure = function(config) {
        _.extend(Nucleus.config, config);
        Nucleus.config.projectDir = path.join(homeDir, ".nucleus/",Nucleus.config.project);
    };

    this.initialize = function() {
        this.nucleusCloneRepo();
    };

};

NucleusDocuments.allow({
    insert: function() {
        return true;
    },
    update: function() {
        return true;
    },
    remove: function() {
        return true;
    },
    fetch: [""]
});

Meteor.publish("nucleusPublisher",function() {
    return [
        NucleusDocuments.find({}),
        ShareJsDocs.find({})
    ];
});


Nucleus = new NucleusFactory();
