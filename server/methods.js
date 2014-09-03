Meteor.methods({
    nucleusGetFileList: function() {
        return Nucleus.getDirTree({rootDir: Nucleus.config.projectDir, parent: "#"});
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
    },
    nucleusGetAllCSS: function(options) {
        return Nucleus.getAllCSS(options);
    },
    nucleusMupDeploy: function(mup_setup) {
        return Nucleus.mupDeploy(mup_setup);
    },
    nucleusCreateNewFile: function(filepath) {
        return Nucleus.createNewFile(filepath);
    },
    nucleusCreateNewFolder: function(filepath) {
        return Nucleus.createNewFile(filepath, true);
    },
    nucleusDeleteFile: function(filepath) {
        return Nucleus.deleteFile(filepath);
    },
    nucleusRenameFile: function(oldpath, newpath) {
        return Nucleus.renameFile(oldpath, newpath);
    }
});
