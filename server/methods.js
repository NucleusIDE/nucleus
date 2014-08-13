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

        //when trying to save scratch pad
        if(!docId) return false;

        var doc = ShareJsDocs.findOne(docId),
            filepath = NucleusDocuments.findOne({doc_id: docId}).filepath,
            newContents = doc.data.snapshot,
            fut = new Future();


        fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
            if (_.isEqual(contents, newContents)) {
                console.log("NO NEW CHANGES TO SAVE");
                fut.return(0);
                return fut.wait();
            }

            fs.writeFile(filepath, newContents, function(err) {
                if(err) {
                    console.log("ERROR OCCURED WHEN WRITING FILE",err);
                    fut.return(-1);
                }
                else {
                    console.log("FILE SAVED SUCCESSFULLY");
                    fut.return(1);
                }
            });
        });

        return fut.wait();
    },
    nucleusSetupFileForEditting: function(filepath) {
        var nucDoc = NucleusDocuments.findOne({filepath: filepath}),
            fileContents = Nucleus.getFileContents(filepath),
            docId = nucDoc && nucDoc.doc_id;

        if (docId) {
            ShareJsDocs.update({_id: docId}, {$set: {"data.snapshot": fileContents}});
            console.log("DOCID", docId);
            return docId;
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
    },
    nucleusCommitAllChanges: function(message) {
        return Nucleus.commitChanges(message);
    },
    nucleusPushChanges: function() {
        return Nucleus.pushChanges();
    },
    nucleusPullChanges: function() {
        return Nucleus.pullChanges();
    }
});
