/*global Files, UltimateFile */

Ultimate('Files').extends({});

this.Files = function() {
  Meteor.subscribe('ultimateFiles');
  this.tree = UltimateFile.collection;
  this.workingFiles = this.tree.find({is_working_file: true});
};

Files.prototype.addWorkingFile = function(filepath, options /* {temp: true|false} */) {
  options = options || {};
  options.temp = typeof options.temp === 'undefined' ? true : options.temp;
  var file = this.tree.findOne({filepath: filepath});

  var previousWorkingFile = file.is_working_file;
  var previousTempFile = this.tree.findOne({is_temporary_working_file: true});

  if(previousWorkingFile && !previousTempFile) return;

  if(previousTempFile && filepath !== previousTempFile.filepath) {
    previousTempFile.is_temporary_working_file = false;
    previousTempFile.is_working_file = false;
    previousTempFile.save();
  }

  file.is_working_file = true;
  file.is_temporary_working_file = options.temp;
  file.save();
};

Files.prototype.removeWorkingFile = function(filepath) {
  var file = this.tree.findOne({filepath: filepath});
  file.is_working_file = null;
  file.is_temporary_working_file = null;
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
  var serverRegex = new RegExp('\/server\/');
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
  this.setupFileForEditting(filepath, forceRefresh, function (err, res) {
    if (err) {
      console.log(err);
      return;
    }
    Session.set('nucleus_selected_doc_id', res);
    Session.set('nucleus_selected_file', filepath);

    // var user = NucleusUser.me();
    // if (!user) return; // this is to avoid a message in console which shows up when user is not yet logged in
    // user.setCwd(res);
    // user.setCurrentFilepath(filepath);
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

  this.saveDocToFile(selectedDocId, function (err, res) {
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
Files.prototype.refresh = function (fileId, shouldEvalInNucleus) {
  var ultimateFile = UltimateFiles.findOne(fileId);
  if (!ultimateFile) {
    console.log('Cant find doc with id', fileId);
    return;
  }
  var filepath = ultimateFile.filepath,
      sharejsDoc = ShareJsDoc.collection.findOne(ultimateFile.sharejs_doc_id),
      newFileContent = sharejsDoc.data.snapshot,
      oldDocContent = ultimateFile.last_snapshot;

  var refreshFunc = shouldEvalInNucleus ? this.origLiveUpdateRefreshFile : LiveUpdate.refreshFile;

  refreshFunc.call(LiveUpdate, {
    newContent: newFileContent,
    fileType: this.getFileType(filepath),
    oldContent: oldDocContent,
    filepath: filepath
  });

};

Files.prototype.newFileWithPrompt = function newFilePrompt(type) {
  var selectedFile = Session.get('nucleus_selected_file');
  var siblingDoc = UltimateIDE.Files.tree.findOne({filepath: selectedFile});
  var parentId, type = Utils.capitalizeFirstLetter(type);

  if(!siblingDoc)
    parentId = '/';
  else if(siblingDoc.type === 'file')
    parentId = siblingDoc.appPath;
  else if(siblingDoc.type === 'folder')
    parentId = siblingDoc.filepath;

  if(!parentId) return;

  new UltimatePrompt('newFilePrompt', {
    Location: {
      type: String,
      defaultValue: parentId
    },
    'New Name': {
      type: String
    }
  }, {
    title: 'New ' + type
  }).show(function(res) {
    var loc = res['Location'];
    loc = loc[loc.length - 1] === '/' ? loc : loc + '/';
    var newFilepath = loc + res['New Name'];
    newFilepath = newFilepath[0] === '/' ? newFilepath.slice(1) : newFilepath;

    this.createNewFile(newFilepath, type === 'Folder', function newFileHandler(err, createdFilepath) {
      if (err)
        return console.error('Error  while creating new file/folder: ', err);

      this.updateFileTreeCollection(function updateFileTree(err) {
        if (err) {
          return console.error('Error while refreshing File Tree', err);
        }
        Flash.success('Created new ' + type);
      }.bind(this))

    }.bind(this));

  }.bind(this));

};


/**
 * EVAL AUTO RUN
 */
Deps.autorun(function () {
  Meteor.subscribe('nucleusPublisher');

  //below approach is required to eval the new changes for al connected clients and not for present client only
  UltimateFiles.find({shouldEval: true}).forEach(function (doc) {
    UltimateIDE.Files.unmarkDocForEval(doc);
    UltimateIDE.getWindow('app').eval('UltimateIDE.Files.refresh("' + doc._id + '")');

    if (doc.shouldEvalInNucleus) {
      //we can keep this here because all files no matter where they are located are evaled for app

      var oldCursorPosition = UltimateIDE.Editor.editor.getCursorPosition(),
          oldScrollPosition = [UltimateIDE.Editor.editor.session.getScrollTop(), UltimateIDE.Editor.editor.session.getScrollLeft()];

      UltimateIDE.Files.refresh(doc._id, true);
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
