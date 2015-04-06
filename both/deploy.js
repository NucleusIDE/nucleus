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

        var sanitizeJson = R.pipe(R.split('\n'),
                                  R.map(R.trim),
                                  R.filter(R.strIndexOf('//')),
                                  R.join('\n'));

        future.return(sanitizeJson(res));
      });
      return future.wait();
    };

    if (fs.existsSync(mupFilePath)) {
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

  DeployManager.prototype.saveMupJson = function(mupJson) {
    var projectDir = Nucleus.config.projectDir,
        mupFilePath = path.resolve(projectDir, 'mup.json'),
        fut = new Future();

    fs.writeFile(mupFilePath, mupJson, function(err) {
      if (err) fut.throw(new Meteor.Error(err));

      fut.return(true);
    });

    return fut.wait();
  };

  Meteor.methods({
    'nucleusGetMupJson': function() {
      return JSON.parse(Nucleus.Deploy.getMupJson());
    },
    'nucleusSaveMupJson': function(mup) {
      var mupJson = JSON.stringify(mup, null, 2);
      return Nucleus.Deploy.saveMupJson(mupJson);
    }
  });
}

if (Meteor.isClient) {
  DeployManager.prototype.getMupJson = function(cb) {
    var mupPath = '';
    Meteor.call('nucleusGetMupJson', mupPath, cb);
  };

  DeployManager.prototype.getMupSimpleSchema = function(cb) {
    this.getMupJson(function(err, mup) {
      if (err) {
        console.log("Error while getting Mup.json", err);
        return err.message;
      }
      mup = typeof mup === 'string' ? JSON.parse(mup) : mup;

      function convertObjectToSimpleSchema(json) {
        var schema = {};

        _.each(json, function(v, prop) {
          schema[prop] = {};
          schema[prop].label = prop; //label for form
          schema[prop].type = R.type(v);
          schema[prop].defaultValue = JSON.stringify(v);

          if (schema[prop].type === 'Boolean') {
            schema[prop].autoform = {
              afFieldInput: {
                falseLabel: 'No',
                trueLabel: 'Yes',
                // type: 'boolean-radios'
              }
            };
          }

          if (schema[prop].type === 'Array' || schema[prop].type === 'Object') {
            schema[prop].type = 'String';
            schema[prop].autoform = {
              afFieldInput: {
                rows: 4
              }
            };
          }
        });

        return new SimpleSchema(schema);
      }

      var schema = convertObjectToSimpleSchema(mup);

      window.schema = schema;
      window.mup = mup;

      cb(null, schema);
    });
  };
}
