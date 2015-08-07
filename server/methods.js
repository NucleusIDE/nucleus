/**
 * # Meteor.methods
 *
 * In meteor, methods are the easiest way of interaction b/w client and server. Most of these methods are simply proxies for functions in `Nucleus` and which are not should
 */


Meteor.methods({
  nucleusGetFileContents: function(filepath) {
    return UltimateIDE.Files.getFileContents(filepath);
  },
  nucleusSaveDocToDisk: function(docId) {
    return UltimateIDE.Files.saveDocToFile(docId);
  },
  nucleusSetupFileForEditting: function(filepath, forceRefresh) {
    return UltimateIDE.Files.setupFileForEditting(filepath, forceRefresh);
  },

  nucleusCreateNewFile: function(filepath) {
    return UltimateIDE.Files.createNewFile(filepath);
  },
  nucleusCreateNewFolder: function(filepath) {
    return UltimateIDE.Files.createNewFile(filepath, true);
  },
  nucleusDeleteFile: function(filepath) {
    return UltimateIDE.Files.deleteFile(filepath);
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
  ultimateCheckUserToken: function(userinfo) {
    var username = userinfo.username,
        loginToken = userinfo.login_token;

    var ultimateUser = UltimateIDEUser.collection.findOne({username: username});

    if (!ultimateUser)
      return false;

    return ultimateUser.hasValidLoginToken(loginToken);
  }
});
