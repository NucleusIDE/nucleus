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

Git.prototype.commit = function(dir, message) {
  var fut = new Future();

  child.exec('cd ' + dir + ' && git add . --all && git commit -m "' + message +'"', function(err, stdout, stderr) {
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

Git.prototype.push = function(dir) {
  var fut = new Future();

  child.exec("cd " + dir + " && git push origin master", function(err, stdout, stderr) {
    if (err) {
      console.log(err);
      fut.return(-1);
    } else if (stderr.search(/Everything up-to-date/) >= 0)
      fut.return(0);
    else
      fut.return(1);

    console.log("STDOUT:", stdout, "STDERR:", stderr);
  });
  return fut.wait();
};

Git.prototype.pull = function(dir) {
  var fut = new Future();
  child.exec("cd " + dir + " && git pull origin master", function(err, stdout, stderr) {
    if (err) {console.log(err); fut.return(-1); }
    else {
      if(stdout.search(/Already up-to-date/) >= 0)
        fut.return(0);
      else
        fut.return(1);

      console.log("STDOUT:", stdout);
      console.log("STDERR", stderr);
    }
  });
  return fut.wait();
};

NucleusGit = new Git(this.config);
