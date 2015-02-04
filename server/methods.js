/**
 * # Meteor.methods
 *
 * In meteor, methods are the easiest way of interaction b/w client and server. Most of these methods are simply proxies for functions in `Nucleus` and which are not should
 */


Meteor.methods({
  nucleusGetFileList: function() {
    return Nucleus.getDirTree({rootDir: Nucleus.config.projectDir, parent: "#"});
  },

  nucleusGetFileContents: function(filepath) {
    /**
     * Has equivalent `Nucleus.getFileContents(filepath)`. Shall be replaced with it in next refactoring.
     */

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
    /**
     * Saves the doc (the changes made in the ace editor) back to the filesystem. Like any other method containing any code in this file, this should be moved to `Nucleus`
     */

    //Flush the doc. Sharejs keeps the changes in memory without actually persisting them to the database for as long as it can. This flushes the changes to the database
    ShareJS.model.flush();

    //when trying to save scratch pad
    if(!docId) return false;

    var doc = ShareJsDocs.findOne(docId),
        filepath = NucleusDocuments.findOne({doc_id: docId}).filepath,
        newContents = doc.data.snapshot,
        fut = new Future();

    fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
      //check if the new changes have been made in the editor or user is just being a dick
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

  nucleusSetupFileForEditting: function(filepath, forceRefresh) {
    /**
     * Sets up `filepath` for editing. It would fetch the contents of the file from the filesystem and put them in a sharejs doc and return the `docId` of newly created doc.
     * If a doc corresponding to the `filepath` already exists, it would simply return the `docId`. `forceRefresh` should be truthy to force it fetching contents from the fiesystem
     *
     * *Arguments:*
     * * `filepath` *{string}*
     * * `forceRefresh` *{boolean}*: Force it to fetch contents from the filesystem. Used when discarding unsaved changes to the doc.
     */

    var nucDoc = NucleusDocuments.findOne({filepath: filepath}),
        fileContents = Nucleus.getFileContents(filepath),
        docId = nucDoc && nucDoc.doc_id;

    if(forceRefresh) {
      ShareJS.model.flush();

      var doc = ShareJsDocs.findOne(docId);
      var ver = doc.data.v;

      /*
       * We can't just remove the `doc` to force fetch new contents from the filesystem.
       * Sharejs would load the file from the memory, or play back the ops or something but even on deleting the doc, it will somehow get all the changes back.
       *
       * To solve this, we need to manually apply an operation (op) on the doc.
       * We need to apply two operatins; delete everything and insert content from disk; to refresh the doc and discard all ops changes
       */

      ShareJS.model.applyOp(
        docId,
        {
          op: [{d: doc.data.snapshot, p: 0}, {i: fileContents, p: 0}],
          v: ver,
          meta: null
        },
        function(err, res) {
          if(err) throw new Error(err);
        });

      return docId;
    }

    if (docId) {
      ShareJsDocs.update({_id: docId}, {$set: {"data.snapshot": fileContents}});
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
  nucleusCommitAllChanges: function(message, selectedFile) {
    /**
     * We use selectedFile to see if the file belongs to a package. If it does, we try to make the commit for the package instead of the app itself
     */
    return Nucleus.commitChanges(message, selectedFile);
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
