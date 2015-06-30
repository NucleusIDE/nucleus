/*global Git */

var child = Npm.require('child_process'),
    fs = Npm.require('fs'),
    Future = Npm.require('fibers/future'),
    format = Npm.require('util').format;

this.Git = function() {};

Git.prototype.getTopmostGitDir = function(filepath) {
  var dir = UltimateIDE.config.projectDir;

  var getPackageDir = function(filepath) {
    var tempDir = path.dirname(filepath);
    if (path.basename(path.dirname(tempDir)) == 'packages') {
      return tempDir;
    } else {
      tempDir = path.dirname(tempDir);
      return getPackageDir(tempDir);
    }
  };

  if (/packages/.test(filepath)) {
    var packageDir = getPackageDir(filepath);
    if (NucleusGit.isGitRepo(packageDir)) {
      dir = packageDir;
    }
  }

  return dir;
};

Git.prototype.isGitRepo = function(path) {
  return fs.existsSync(path+'/.git');
};

Git.prototype.commitAll = function(path, message, author) {
  dir = this.getTopmostGitDir(path);
  var fut = new Future();

  var env = process.env,
      someVar,
      envDup = {};
  // Duplicate the parent's environment object
  for (someVar in env) {
    envDup[someVar] = env[someVar];
  }

  envDup['GIT_COMMITTER_EMAIL'] = author.email;
  envDup['GIT_COMMITTER_NAME'] = author.name;
  envDup['GIT_AUTHOR_EMAIL'] = author.email;
  envDup['GIT_AUTHOR_NAME'] = author.name;

  child.exec('cd ' + dir + ' && git add . --all && git commit -m "' + message +'"',
             { env: envDup }, function(err, stdout, stderr) {
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

Git.prototype.push = function(path, githubUser) {
  dir = this.getTopmostGitDir(path);
  var fut = new Future();
  var loginToken = githubUser.loginToken;
  githubUser = NucleusUsers.findOne({username: githubUser.username});

  if (! githubUser.hasValidLoginToken(loginToken)) {
    console.log("Invalid Login token", loginToken);
    fut.return(-1);
  }

  var remote = githubUser.username,
      token = githubUser.github_access_token,
      repo = UltimateIDE.config.git.split('/').reverse().slice(0, 2).reverse().join('/'), //convert https://github.com/NucleusIDE/nucleus to NucleusIDE/nucleus
      remoteUrl = 'https://'+remote+':'+token+'@github.com/'+repo;

  var command = format("cd %s ; git remote rm %s ; git remote add %s %s", dir, remote, remote, remoteUrl); //update/create a remote <username> with user's github credentials
  command += format(" ; git push %s master", remote);

  child.exec(command, function(err, stdout, stderr) {
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

Git.prototype.pull = function(path) {
  dir = this.getTopmostGitDir(path);
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
