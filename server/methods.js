/**
 * # Meteor.methods
 *
 * In meteor, methods are the easiest way of interaction b/w client and server. Most of these methods are simply proxies for functions in `Nucleus` and which are not should
 */


Meteor.methods({
  nucleusGetFileList: function() {
    return Nucleus.files.getFileTree({rootDir: Nucleus.config.projectDir, traverseSymlinks: true});
  },
  nucleusGetFileContents: function(filepath) {
    return Nucleus.files.getFileContents(filepath);
  },
  nucleusSaveDocToDisk: function(docId) {
    return Nucleus.files.saveDocToFile(docId);
  },
  nucleusSetupFileForEditting: function(filepath, forceRefresh) {
    return Nucleus.files.setupFileForEditting(filepath, forceRefresh);
  },

  nucleusCreateNewFile: function(filepath) {
    return Nucleus.files.createNewFile(filepath);
  },
  nucleusCreateNewFolder: function(filepath) {
    return Nucleus.files.createNewFile(filepath, true);
  },
  nucleusDeleteFile: function(filepath) {
    return Nucleus.files.deleteFile(filepath);
  },
  nucleusRenameFile: function(oldpath, newpath) {
    return Nucleus.fiels.renameFile(oldpath, newpath);
  },

  nucleusCommitAllChanges: function(message, selectedFile, author) {
    /**
     * We use selectedFile to see if the file belongs to a package. If it does, we try to
     * make the commit for the package instead of the app itself
     */
    return Nucleus.git.commitAll(message, selectedFile, author);
  },
  nucleusPushChanges: function(selectedFile, githubUser) {
    /**
     * We use selectedFile to see if the file belongs to a package. If it does, we try to
     * make the commit for the package instead of the app itself
     */
    return Nucleus.git.push(selectedFile, githubUser);
  },
  nucleusPullChanges: function(selectedFile) {
    return Nucleus.git.pull(selectedFile);
  },

  nucleusMupDeploy: function(mup_setup) {
    return Nucleus.mupDeploy(mup_setup);
  },


  nucleusIsTerminalConfigured: function() {
    return Nucleus.config.terminalInitialized;
  },
  nucleusCheckUserToken: function(userinfo) {
    var username = userinfo.username,
        loginToken = userinfo.login_token;

    var nucUser = NucleusUsers.findOne({username: username});

    if (!nucUser)
      return false;

    return nucUser.hasValidLoginToken(loginToken);
  }
});
