var fs = Npm.require('fs'),
    path = Npm.require('path'),
    child = Npm.require('child_process'),
    // ShareJs = Npm.require('share').server,
    Future = Npm.require('fibers/Future');


var getFileContents = function(filepath) {
    if (filepath === '*scratch*') return;

    if (typeof filepath !== 'string' || fs.lstatSync(filepath).isDirectory()) return;

    var fut = new Future();
    fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
        if (err) {
            console.log(err);
        }
        fut['return'](contents);
    });
    return fut.wait();
};

Meteor.methods({
    nucleusGetFileList: function() {
        var dirTree = function (filename, parent) {
            // if (path.basename(filename).indexOf(".") === 0) return false; //not showing hidden files/folders

            var stats = fs.lstatSync(filename),
                info = {
                    path: filename,
                    parent: parent,
                    name: path.basename(filename)
                };

            if (stats.isDirectory()) {
                info.type = "folder";
                info.children = fs.readdirSync(filename).map(function(child) {
                    return dirTree(filename + '/' + child, filename);
                });
            } else {
                // Assuming it's a file. In real life it could be a symlink or
                // something else!
                info.type = "file";
            }
            return info;
        };
        var tree = dirTree(Nucleus.config.projectDir, "#");
        return(tree);
    },
    nucleusGetFileContents: function(filepath) {
        if (typeof filepath !== 'string' || fs.lstatSync(filepath).isDirectory()) return;

        var fut = new Future();
        fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
            if (err) {
                console.log(err);
            }
            fut['return'](contents);
        });
        return fut.wait();
    },
    nucleusSaveDocToDisk: function(docId) {
        ShareJS.model.flush();

        if(!docId) return;

        var doc = ShareJsDocs.findOne(docId),
            filepath = NucleusDocuments.findOne({doc_id: docId}).filepath,
            newContents = doc.data.snapshot;

        fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
            console.log("OLD CONTENTS ARE", contents);
            console.log("OLD CONTENTS ARE", newContents);

            if (_.isEqual(contents, newContents)) {
                console.log("NO NEW CHANGES TO SAVE");
                return;
            }

            fs.writeFile(filepath, newContents, function(err) {
                if(err)
                    console.log("ERROR OCCURED WHEN WRITING FILE",err);
                else console.log("FILE SAVED SUCCESSFULLY");
            });
        });
    },
    nucleusSetupFileForEditting: function(filepath) {
        var doc = ShareJsDocs.findOne({filepath: filepath}),
            fileContents = getFileContents(filepath),
            docId = doc && doc._id;

        if (doc) {
            ShareJsDocs.update({_id: doc._id}, {$set: {"data.snapshot": fileContents}});
        } else {
            docId = ShareJsDocs.insert({
                data: {
                    "snapshot": fileContents,
                    "v": 0,
                    "type": "text"
                }
            });
            var nucleusDocId = NucleusDocuments.insert({
                doc_id: docId,
                filepath: filepath
            });
        }
        return docId;
    }
});

NucleusFactory = function() {
    var homeDir = process.env.HOME,
        nucleusDir = path.join(homeDir, ".nucleus");

    this.config = {
        projectDir: './',
        git: '',
        project: ''
    };

    this.nucleusCloneRepo = function(git, project) {
        git = git || Nucleus.config.git;
        project = project || Nucleus.config.project;
        var projectDir = path.join(homeDir, ".nucleus/",project);

        if (! git) return;
        var nucleusDirExists = fs.existsSync(nucleusDir);
        var repoAlreadyCloned = fs.existsSync(projectDir);

        if (!nucleusDirExists) fs.mkdirSync(path.join(homeDir, ".nucleus"));

        if (!repoAlreadyCloned) {
            child.exec("cd " + nucleusDir + " && git clone " + git + " " + project, function(err, stdout, stderr) {
                if (err) {console.log(err); return;}
                console.log(stdout, stderr);
            });
        }

        if (nucleusDirExists && repoAlreadyCloned)
            child.exec("cd " + projectDir + " && git pull", function(err, stdout, stderr) {
                if (err) {console.log(err); return;}
                console.log(stdout, stderr);
            });
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
