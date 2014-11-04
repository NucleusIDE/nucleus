var fs = Npm.require("fs"),
    path = Npm.require("path");

CrashWatcher = {
  initialize: function() {
    var refresh_file = path.resolve(Nucleus.config.projectDir, ".nuc-files-to-refresh");
    fs.watchFile(refresh_file, Meteor.bindEnvironment(function(curr, prev) {
      if (curr.nlink === 0) {
        //do not try to read file if it is not present
        return;
      }
      fs.readFile(refresh_file, {encoding: 'utf-8'}, Meteor.bindEnvironment(function(err, data) {
        if (err) {
          console.log("ERROR WHILE READING REFRESH FILE", err);
          return;
        }

        var files_to_refresh = data.trim() && data.split("\n");
        _.each(files_to_refresh, function(file) {
          Meteor.call("nucleusSetupFileForEditting", file, true, function(err, res) {
//            FlashMessages.sendError("We had to revert a file.");
          });
        });
        fs.unlink(refresh_file);
      }));
    }));
  }
};
