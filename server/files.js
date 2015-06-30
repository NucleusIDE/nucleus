/*global Files */


var fs = Npm.require('fs'),
    path = Npm.require('path'),
    child = Npm.require('child_process'),
    Future = Npm.require('fibers/future');

this.Files = function(ideInstance) {
  this.UltimateIDE = ideInstance;
};

Files.prototype.getFileTree = function(options) {
  /**
   * Returns Array of all files present in project to be used in explorer file-tree
   *
   * @traverseSymlinks (Boolean) shall we traverse symlinks?
   * @includeHidden (Boolean)  shall we include hidden files in the produced tree?
   *    (hidden files/directories are those whose name start with `.`)
   */

  options = options || {};
  var rootDir = options.rootDir || this.UltimateIDE.config.projectDir;
  var includeHidden = options.includeHidden || false;
  var traverseSymlinks = options.traverseSymlinks || true;

  if(!rootDir) {
    throw new Meteor.Error('Please provide `rootDir` to start the tree from.');
  }

  var walk = function(filepath, parentId, func) {
    if (typeof func !== 'function') {
      func = parentId;
      parentId = null;
    }

    if (filepath.indexOf('.') === 0) {
      return (func(false));
    }

    if (parentId) {
      filepath = path.resolve(parentId, filepath);
    }

    var stats = fs.lstatSync(filepath);
    var info = {
      type: null,
      filepath: filepath,
      parentId: parentId || null,
      name: path.basename(filepath),
      hasChildren: false
    };

    if (stats.isDirectory()) {
      func(_.extend(info, {type: 'folder', hasChildren: true}));

      fs.readdirSync(filepath).forEach(function(child) {
        walk(child, filepath, func);
      });

    } else if (stats.isSymbolicLink()) {
      if(!traverseSymlinks)
        return func(_.extend(info, {type: 'symlink', hasChildren: false, parentId: parentId}));

      var link = fs.readlinkSync(filepath);
      if (link.indexOf(".") === 0) return;

      if(fs.lstatSync(link).isDirectory()) {
        func(_.extend(info, {type: 'folder', hasChildren: true}));

        fs.readdirSync(link).forEach(function(child) {
          walk(child, filepath, func);
        });
      }
    } else {
      func(_.extend(info, {type: 'file', hasChildren: false, parentId: parentId}));
    }
  };

  var  mkDirTree= function () {
    var tree = [];

    walk(rootDir, function(node) {
      if(!! node && !! node.parentId) { //don't push falsy rows or the root node
        if(node.parentId === rootDir)
          node.parentId = null; //set the parentId of root's children to null so they won't try to show up as anybody's children
        node.appPath = node.filepath.replace(rootDir, '').replace(node.name, ''); //we don't want to show absolute name
        tree.push(node);
      }
    });

    return tree;
  };


  var tree = mkDirTree(options);
  return tree;
  ;
};

Files.prototype.getFileExtension = function (filepath) {
  return path.extname(filepath).replace(".", "");
};

Files.prototype.getFileContents = function(filepath) {
  /**
   * Get the contents of a single file.
   *
   * @filepath - absolute path of the file whose contents are required
   */
  if (typeof filepath !== 'string' || fs.lstatSync(filepath).isDirectory()) return false;
  if (filepath === '*scratch*') return false;

  var fut = new Future();
  fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
    if (err) {
      console.log(err);
    }
    fut['return'](contents);
  });
  return fut.wait();
};

Files.prototype.createNewFile = function(filepath, directory) {
  /**
   * Create a new file on the server
   *
   * Arguments:
   * @`filepath` {*string*} : Absolute or relative path of the file to be created. Relative to `Ultimate.config.projectDir`
   * @`directory` {*boolean*}: Is the file to be created a directory?
   */

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

/**
 * Saves the doc (the changes made in the ace editor) back to the filesystem.
 */
Files.prototype.saveDocToFile = function(docId) {
  //Flush the doc. Sharejs keeps the changes in memory without actually persisting them to
  // the database for as long as it can. This flushes the changes to the database
  ShareJS.model.flush();

  //when trying to save scratch pad
  if(!docId) return false;

  var doc = ShareJsDoc.collection.findOne({_id: docId});


  var filepath = UltimateFiles.findOne({sharejs_doc_id: docId}).filepath,
      newContents = doc.data.snapshot,
      fut = new Future();

  fs.readFile(filepath, {encoding: 'utf-8'}, function(err, contents) {
    //check if the new changes have been made in the editor or user is just being a dick
    if (_.isEqual(contents, newContents)) {
      console.log("NO NEW CHANGES TO SAVE");
      fut.return({status: 0});
      return fut.wait();
    }

    fs.writeFile(filepath, newContents, function(err) {
      if(err) {
        console.log("ERROR OCCURED WHEN WRITING FILE",err);
        fut.return({status: -1});
      }
      else {
        console.log("FILE SAVED SUCCESSFULLY");
        fut.return({status: 1, oldDocContent: contents});
      }
    });
  });

  return fut.wait();
};

Files.prototype.deleteFile = function(filepath) {
  /**
   * Delete the file at `filepath`
   *
   * Arguments:
   * @`filepath` *{string}*
   *
   * If the file represented by `filepath` is a directory, it deletes the directory
   * recursively.
   */
  if (!fs.existsSync(filepath)) {
    return true;
  }
  var stat = fs.statSync(filepath);

  var fut = new Future();

  if (stat.isDirectory())
    child.exec("rm -rf "+filepath, function(err, res) {
      fut.return(res);
    });
  else {
    fut.return(fs.unlinkSync(filepath));
    var ultimateFile = UltimateFiles.findOne({filepath: filepath});
    var shareJsDocId = ultimateFile ? ultimateFile.sharejs_doc_id : null;
    UltimateFiles.remove({_id: ultimateFile._id});
    ShareJsDocs.remove({_id: shareJsDocId});
  }

  return fut.wait();
};

Files.prototype.renameFile = function(oldpath, newpath) {
  /**
   * Rename `oldpath` to `newpath`
   */
  if (!fs.existsSync(oldpath)) {
    return false;
  }

  var renameFileOp = fs.renameSync(oldpath, newpath);
  UltimateFiles.update({filepath: oldpath}, {$set: {filepath: newpath}});

  return true;
};

Files.prototype.setupFileForEditting = function(filepath, forceRefresh) {
  /**
   * Sets up `filepath` for editing. It would fetch the contents of the file from the
   * filesystem and put them in a sharejs doc and return the `docId` of newly created doc.
   * If a doc corresponding to the `filepath` already exists, it would simply return the
   * `docId`. `forceRefresh` should be truthy to force it fetching contents from the
   * fiesystem
   *
   * *Arguments:*
   * * `filepath` *{string}*
   * * `forceRefresh` *{boolean}*: Force it to fetch contents from the filesystem. Used when discarding unsaved changes to the doc.
   */

  var ultimateFile = UltimateFiles.findOne({filepath: filepath}),
      fileContents = this.getFileContents(filepath),
      docId = ultimateFile && ultimateFile.sharejs_doc_id;

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
  } else {
    docId = ShareJsDocs.insert({
      data: {
        "snapshot": fileContents,
        "v": 0,
        "type": "text"
      }
    });
  }

  ultimateFile.sharejs_doc_id = docId;
  ultimateFile.save();

  return docId;
};

Files.prototype.updateFileTreeCollection = function() {
  this.getFileTree().forEach(function(file) {
    var existingFile = UltimateFiles.findOne({filepath: file.filepath});
    if (existingFile) {
      return existingFile.update(file);
    }
    UltimateFiles.insert(file);
  });
};
