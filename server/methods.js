/**
 * # Meteor.methods
 *
 * In meteor, methods are the easiest way of interaction b/w client and server. Most of these methods are simply proxies for functions in `Nucleus` and which are not should
 */


Meteor.methods({
  nucleusGetFileList: function() {
    return UltimateIDE.files.getFileTree({rootDir: UltimateIDE.config.projectDir, traverseSymlinks: true});
  },
  nucleusGetFileContents: function(filepath) {
    return UltimateIDE.files.getFileContents(filepath);
  },
  nucleusSaveDocToDisk: function(docId) {
    return UltimateIDE.files.saveDocToFile(docId);
  },
  nucleusSetupFileForEditting: function(filepath, forceRefresh) {
    return UltimateIDE.files.setupFileForEditting(filepath, forceRefresh);
  },

  nucleusCreateNewFile: function(filepath) {
    return UltimateIDE.files.createNewFile(filepath);
  },
  nucleusCreateNewFolder: function(filepath) {
    return UltimateIDE.files.createNewFile(filepath, true);
  },
  nucleusDeleteFile: function(filepath) {
    return UltimateIDE.files.deleteFile(filepath);
  },
  nucleusRenameFile: function(oldpath, newpath) {
    return UltimateIDE.fiels.renameFile(oldpath, newpath);
  },

  nucleusCommitAllChanges: function(message, selectedFile, author) {
    /**
     * We use selectedFile to see if the file belongs to a package. If it does, we try to
     * make the commit for the package instead of the app itself
     */
    return UltimateIDE.git.commitAll(message, selectedFile, author);
  },
  nucleusPushChanges: function(selectedFile, githubUser) {
    /**
     * We use selectedFile to see if the file belongs to a package. If it does, we try to
     * make the commit for the package instead of the app itself
     */
    return UltimateIDE.git.push(selectedFile, githubUser);
  },
  nucleusPullChanges: function(selectedFile) {
    return UltimateIDE.git.pull(selectedFile);
  },

  nucleusMupDeploy: function(mupSetup) {
    return UltimateIDE.mupDeploy(mupSetup);
  },


  nucleusIsTerminalConfigured: function() {
    return UltimateIDE.config.terminalInitialized;
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
