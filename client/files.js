/*global Files, UltimateFile */

this.Files = function() {
  Meteor.subscribe('ultimateFiles');
  this.tree = UltimateFile.collection;
  this.workingFiles = this.tree.find({is_working_file: true});
};

Files.prototype.addWorkingFile = function(filepath) {
  var file = this.tree.findOne({filepath: filepath});
  file.is_working_file = true;
  file.save();
};

Files.prototype.removeWorkingFile = function(filepath) {
  var file = this.tree.findOne({filepath: filepath});
  file.is_working_file = null;
  file.save();
};

/**
 * Check if `filepath` is a client file. Client files are supposed to be evaled live on client
 * side. Although this functionality has not been implemented yet.
 */
Files.prototype.isClientFile = function (filepath) {
  var notClientRegex = /\/(server|public|private|compatibility|tests)\//g;
  return !notClientRegex.test(filepath);
};

Files.prototype.isServerFile = function (filepath) {
  var serverRegex = new RegExp('\/' + this.config.serverDir + '\/');
  return serverRegex.test(filepath);
};

Files.prototype.isCSSFile = function (filepath) {
  return this.getFileType(filepath) === 'css';
};

Files.prototype.getFileType = function (filepath) {
  return filepath.split('.').reverse()[0];
};

/**
 * Edit `filepath` in ace editor.
 *
 * *Arguments:*
 * * `filepath` *{string}*: Path of file to be edited. Can be obtained from the filetree nodes in Nucleus sidebar.
 * * `forceRefresh` *{boolean}*: Discard the changes which are not yet saved to the filesystem and force load `filepath` from filesystem
 */
Files.prototype.editFile = function (filepath, forceRefresh) {
  var file = UltimateFiles.findOne({filepath: filepath});
  UltimateFiles.update({_id: file._id}, {$set: {edit: true, force_refresh: false}}, function(err, num) {
    if (err) {
      console.log('Error: ', err);
    }

    Session.set('nucleus_selected_doc_id', file.sharejs_doc_id);
    Session.set('nucleus_selected_file', file.filepath);
  });
};

/**
 * Save the selected file to Filesystem. This method is called when user press `Cmd-S` or click `Save` button in Nucleus editor.
 *
 * Selected file is `NucleusUser.cwd`.
 */
Files.prototype.saveSelectedFileToDisk = function () {
  var selectedDocId = Session.get('nucleus_selected_doc_id'),
      ultimateFile = UltimateFiles.findOne({sharejs_doc_id: selectedDocId}),
      client = this;
  Meteor.call('nucleusSaveDocToDisk', selectedDocId, function (err, res) {
    if (err) {
      console.log('Error in NucleusClient.saveSelectedFileToDisk', err);
      return;
    }
    if (res.status === 0) FlashMessages.sendWarning('No Changes to Save');
    if (res.status === 1) {
      client.markDocForEval(ultimateFile, res.oldDocContent);
      FlashMessages.sendSuccess('File Saved Successfully');
    }
    if (res.status === 2) FlashMessages.sendError('Something went Wrong when Saving File');
  });
};

/**
 * Creates new `filepath` and execute `cb` callback after completion.
 *
 * *Arguments:*
 * * `filepath`: Path of the file to be created
 * * `cb`: Callback function to be executed after completion.
 */
Files.prototype.createNewFile = function (filepath, cb) {
  Meteor.call("nucleusCreateNewFile", filepath, function (err, res) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, res);
  });
};

/**
 * Creates new `filepath` and execute `cb` callback after completion.
 *
 * *Arguments:*
 * * `filepath`: Path of the file to be created
 * * `cb`: Callback function to be executed after completion.
 */
Files.prototype.createNewFolder = function (filepath, cb) {
  Meteor.call("nucleusCreateNewFolder", filepath, function (err, res) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, res);
  });
};

/**
 * Delete `filepath` (file or directory) and execute `cb` callback after completion.
 *
 * *Arguments:*
 * * `filepath`: Path of the file to be created
 * * `cb`: Callback function to be executed after completion.
 */
Files.prototype.deleteFile = function (filepath, cb) {
  Meteor.call("nucleusDeleteFile", filepath, function (err, res) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, res);
  });
};

/**
 * Rename `oldpath` to `newpath` and execute `cb` callback after completion.
 *
 * *Arguments:*
 * * `oldpath`: Old path of the file/directory to be renamed
 * * `newpath`: New path of the file/directory to be renamed
 * * `cb`: Callback function to be executed after completion.
 */
Files.prototype.renameFile = function (oldpath, newpath, cb) {
  Meteor.call("nucleusRenameFile", oldpath, newpath, function (err, res) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, res);
  });
};

/**
 * Mark `nucDoc` for eval on client side.
 *
 */
Files.prototype.markDocForEval = function (nucDoc, oldDocContent) {
  var filepath = nucDoc.filepath,
      isClientFile = this.isClientFile(filepath);

  var shouldEvalInNucleus = /\/packages\//.test(filepath.toLowerCase());

  if (isClientFile || !this.isServerFile(filepath)) {
    UltimateFiles.update({_id: nucDoc._id}, {$set: {shouldEval: true, last_snapshot: oldDocContent, shouldEvalInNucleus: shouldEvalInNucleus}});
  }
};

/**
 * Unmark `nucDoc` from eval on client side. See `NucleusClient.markDocForEval` above
 *
 */
Files.prototype.unmarkDocForEval = function (nucDoc) {
  UltimateFiles.update({_id: nucDoc._id}, {$set: {shouldEval: false, shouldEvalInNucleus: false}});
};

/**
 * Eval the `nucDoc` on client side. As of now, this function can only act on `CSS` files. Js/HTML files are not supported for now.
 * We will use `channikhabra:live-update` package for evaling js/html on client, when it's implemented.
 *
 */
Files.prototype.evalNucleusDoc = function (docId, shouldEvalInNucleus) {
  var ultimateFile = UltimateFiles.findOne(docId);
  if (!ultimateFile) {
    console.log('Cant find doc with id', docId);
    return;
  }
  var filepath = ultimateFile.filepath,
      doc = ShareJsDocs.findOne(ultimateFile.sharejs_doc_id),
      newFileContent = doc.data.snapshot,
      oldDocContent = ultimateFile.last_snapshot;

  var refreshFunc = shouldEvalInNucleus ? this.origLiveUpdateRefreshFile : LiveUpdate.refreshFile;

  refreshFunc.call(LiveUpdate, {
    newContent: newFileContent,
    fileType: this.getFileType(filepath),
    oldContent: oldDocContent,
    filepath: filepath
  });

};

/**
 * EVAL AUTO RUN
 */
Deps.autorun(function () {
  Meteor.subscribe('nucleusPublisher');

  //below approach is required to eval the new changes for al connected clients and not for present client only
  UltimateFiles.find({shouldEval: true}).forEach(function (doc) {
    UltimateIDE.Files.unmarkDocForEval(doc);
    UltimateIDE.getWindow('app').eval('UltimateIDE.Files.evalNucleusDoc("' + doc._id + '")');

    if (doc.shouldEvalInNucleus) {
      //we can keep this here because all files no matter where they are located are evaled for app

      var oldCursorPosition = UltimateIDE.Editor.editor.getCursorPosition(),
          oldScrollPosition = [UltimateIDE.Editor.editor.session.getScrollTop(), UltimateIDE.Editor.editor.session.getScrollLeft()];

      UltimateIDE.Files.evalNucleusDoc(doc._id, true);
      //Since we re-render the whole window in nucleus on file change, the window flickers a little
      //and the cursor position is lost. Let's get the cursor position and set it back after the window flicker
      Meteor.setTimeout(function() {
        UltimateIDE.Editor.editor.moveCursorToPosition(oldCursorPosition);
        UltimateIDE.Editor.editor.session.setScrollTop(oldScrollPosition[0]);
        UltimateIDE.Editor.editor.session.setScrollLeft(oldScrollPosition[1]);
        UltimateIDE.Editor.editor.focus();
      }, 400);
    }
  });
});
