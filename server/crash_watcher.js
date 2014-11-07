var fs = Npm.require("fs"),
    path = Npm.require("path"),
    spawn = Npm.require("child_process").spawn;

CrashWatcher = {
  setup_crashing_changes_reverter: function() {
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
  },
  spawn_app_crash_watcher: function() {
    var app_dir = Nucleus.config.projectDir,
        app_url = 'localhost:3000';

    //let's launch nuc-watch-meteor from inside the nucleus instead of explicitly calling it
    var watcher = spawn("nuc-watch-meteor", ["", "-d ",app_dir, "-u ",app_url], {detatched: true});

    watcher.stdout.setEncoding("utf-8");
    watcher.stderr.setEncoding("utf-8");

    var errHandler = function(err) {
      console.log("nuc-watch-meteor ERROR", err.message);
    };

    watcher.stdout.on('err', errHandler);
    watcher.stderr.on('err', errHandler);

    watcher.stdout.on('data', function(data) {
      console.log("Nuc-Watch-Meteor: [stdout]", data);
    });

    watcher.stderr.on('data', function(data) {
      console.log("Nuc-Watch-Meteor: [strerr]", data);
    });

    watcher.on('close', function(code) {
      console.log("nuc-watch-meteor ended with code", code);
    });

    watcher.unref();
  },
  initialize: function() {
    this.setup_crashing_changes_reverter();
    this.spawn_app_crash_watcher();
  }
};
