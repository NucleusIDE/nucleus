DeployManager = function() {};

if (Meteor.isServer) {
  var path = Npm.require('path'),
      fs = Npm.require('fs'),
      child = Npm.require('child_process'),
      Future = Npm.require('fibers/future');

  DeployManager.prototype.getMupJson = function() {
    var projectDir = Nucleus.config.projectDir,
        mupFilePath = path.resolve(projectDir, 'mup.json'),
        fut = new Future();

    var readFile = function(filepath) {
      var future = new Future();
      fs.readFile(filepath, 'utf-8', function(err, res) {
        if(err) fut.throw(err);
        future.return(res);
      });
      return future.wait();
    };

    if (fs.existsSync(mupFilePath)) {
      console.log("Mup file exists. Reading", mupFilePath);
      fut.return(readFile(mupFilePath));
    } else {

      try {
        var mupInit = child.exec('cd ' + projectDir + ' && mup init', {pwd: projectDir}, function(err, stdout, stderr) {
          if (err)
            fut.throw(err);

          console.log("Mup stdout", stdout.toString('utf-8'));
          console.log("Mup stdout", stderr.toString('utf-8'));

          fut.return(readFile(mupFilePath));
        }.future());
      } catch(e) {
        console.log("Exception while calling mup init", e);
      }
    }

    return fut.wait();
  };


  Meteor.methods({
    'nucleusGetMupJson': function() {
      return Nucleus.Depoy.getMupJson();
    }
  });
}

if (Meteor.isClient) {
  DeployManager.prototype.getMupJson = function(cb) {
    var mupPath = '';
    Meteor.call('nucleusGetMupJson', mupPath, cb);
  };
}
