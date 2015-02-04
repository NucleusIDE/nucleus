var child = Npm.require('child_process'),
    fs = Npm.require('fs'),
    Future = Npm.require('fibers/future'),
    format = Npm.require('util').format;

var Git = function(config) {
  this.config = config;
};

Git.prototype.isGitRepo = function(path) {
  return fs.existsSync(path+'/.git');
};

Git.prototype.commit = function(path, message) {
  var fut = new Future();

  child.exec('cd ' + path + ' && git add . --all && git commit -m "' + message +'"', function(err, stdout, stderr) {
    if (err) {
      if (err.killed === false && err.code === 1 && err.signal === null) {
        fut.return(0);

      } else {
        console.log(err);
        fut.return(-1);
      }
    } else {
      console.log(stdout, stderr);
      fut.return(1);
    }
  });
  return fut.wait();
};

Git.prototype.push = function(path) {

};

var handleError = function(err, msg) {
  console.log(format("Error: %s", msg));
  console.log(format("Error: %s", err.message));
};


NucleusGit = new Git(this.config);
