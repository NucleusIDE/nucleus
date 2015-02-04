var child = Npm.require('child_process'),
format = Npm.require('util').format;

Git = function(config) {
  this.config = config;
};

Git.prototype.commitPackageCode = function(message, packageName) {
  child.exec('cd %s'.format(this.config.projectDir), function(err, res) {
    if (err) {
      console.log(err); return;
    }
    console.log(res);
  });
};
