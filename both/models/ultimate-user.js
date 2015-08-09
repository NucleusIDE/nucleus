/* global UltimateIDEUser, UltimateIDEUsers, Meteor, Npm, Ultimate, UltimateModel */
/* eslint-disable camelcase*/

var Future = null;

if (Meteor.isServer) {
  Future = Npm.require('fibers/Future');
}

this.UltimateIDEUser = Ultimate('UltimateIDEUser').extends(UltimateModel, {
  getColor: function() {
    return this.color;
  },
  getLoginToken: function() {
    if (Meteor.isServer) {
      if (typeof this.login_tokens !== 'undefined' && this.login_tokens.length !== 0) {
        return this.login_tokens[0].token;
      }

      var crypto = Npm.require('crypto'),
          username = this.username,
          id = this._id,
          date = moment().toDate().valueOf().toString(),
          salt = Math.random().toString();

      var token = crypto.createHash('sha1').update(username + id + date + salt).digest('hex');
      this.update({login_tokens: [{token: token, created_at: moment().toDate()}]});

      return token;
    }
    return null;
  },
  hasValidLoginToken: function(token) {
    if (typeof this.login_tokens === 'undefined')
      return false;

    var myTokens = this.login_tokens.map(function(t) {
      return t.token;
    });

    return _.contains(myTokens, token);
  },

  getCwd: function() {
    return this.cwd;
  },
  setCwd: function(newCwd) {
    this.update({cwd: newCwd});
  },

  setCursor: function(row, col) {
    this.update({cursor: [row, col]});
  },
  getCursor: function() {
    return this.cursor;
  },

  delete: function() {
    /**
     * Deletes the user. It would work and should be used only on client since Session or cookie won't be available on server.
     */

    UltimateIDEUser.collection.remove({_id: this._id});
    if (Meteor.isServer) {
      return;
    }
    $.cookie("ultimate_user", null);
    Session.set("ultimate_user", null);
  },

  isCollaboratorOfRepo: function(repo, access_token) {
    if (Meteor.isServer) {
      console.log('Checking for collaborator');
      var api_endpoint = 'https://api.github.com/repos/'+ repo + '/collaborators?scopes=repo&access_token=' + access_token ,
          options = { headers: { "user-agent": 'UltimateIDE/1.0'}},
          res;

      try {
        res = HTTP.get(api_endpoint, options);
      } catch(e) {
        console.log("Error occured while checking collaborator", e);
      }

      var collaborators = _.map(res.data, function(collaborator) { return collaborator.login; });

      return _.contains(collaborators, this.username);
    }
  }
});

UltimateIDEUser.me = function() {
  /**
   * Get currently logged in user.
   */

  if(Meteor.isServer) throw new Error("Client only method");
  var userInfo = JSON.parse($.cookie('ultimate-logged-in-user'));

  userInfo = userInfo || {}; //so doing userInfo.username wont' throw

  return UltimateIDEUser.collection.findOne({username: userInfo.username});
};

UltimateIDEUser._createNewUser = function(github_data) {
  /**
   * Create new ultimate user. Should not be used by itself. Always `UltimateIDEUser.loginWithGithubToken`, it will call this method if needed
   */
  if(Meteor.isServer) {
    if (_.isString(github_data))
      github_data = JSON.parse(github_data);

    var newUser = new UltimateIDEUser();

    newUser.username = github_data.login;
    newUser.email = github_data.email;
    newUser.created_at = moment().toDate();
    newUser.github_data = github_data;
    newUser.nick = newUser.username;

    newUser.save();
    return newUser;
  }

  throw new Meteor.Error('New Ultimate Users can be created from server only. Try to log them in with their github');
};

UltimateIDEUser.loginWithGithubToken = function(token) {
  if (Meteor.isServer) {
    var api_endpoint = 'https://api.github.com/user?access_token=' + token.access_token,
        options = { headers: { "user-agent": 'UltimateIDE/1.0'}},
        ultimateUser = null,
        fut = new Future();

    try {
      var user = JSON.parse(HTTP.get(api_endpoint, options).content);
      ultimateUser = UltimateIDEUser.collection.findOne({'username': user.login});

      if(typeof ultimateUser === 'undefined') {
        console.log("Creating new Ultimate User");
        ultimateUser = UltimateIDEUser._createNewUser(user);
      } else {
        ultimateUser.update({github_data: user});
      }

      // if ultimate repo is hosted on github, check if logging in ultimate user has access to it on github
      // if (Ultimate.config.git && /github/.test(Ultimate.config.git)) {
      //   var repo = Ultimate.config.git.split('/').reverse().slice(0, 2).reverse().join('/'); //convert https://github.com/UltimateIDE/ultimate to UltimateIDE/ultimate

      //   if (! ultimateUser.isCollaboratorOfRepo(repo, token.access_token)) {
      //     throw new Meteor.Error('User doesn\'t have access to project repo');
      //   }
      // }

      ultimateUser.update({
        color: Utils.getRandomColor(),
        //XXX: there is a method in ultimateClient for setting scratch doc
        cwd: null,
        status: 3,
        last_keepalive: moment().toDate().getTime(),
        github_access_token: token.access_token,
        syncing_ultimate_events: false,
        syncing_app_events: false
      });

      fut.return(ultimateUser);
    } catch(e) {
      fut.throw(e);
    }

    return fut.wait();
  }
};

UltimateIDEUser.getOnlineUsers = function() {
  return UltimateIDEUser.find({status:{$ne: 1}});
};

if (Meteor.isClient) {
  //autorun to set user.cwd when user's current working document chagnes
  Tracker.autorun(function() {
    var newCwd = Session.get('nucleus_selected_file');
    if(! newCwd) return;

    var user = UltimateIDEUser.me();
    if(!user) return;

    user.setCwd(newCwd);
  });
}

/**
 * KeepAlive
 */
Statuses = {
  OFFLINE: 1,
  IDLE: 2,
  ONLINE: 3
};

if (Meteor.isServer) {
  Meteor.startup(function() {
    Meteor.methods({
      keepalive: function (nick, status) {
        UltimateIDEUser.collection.update({nick: nick}, {$set: {last_keepalive: moment().toDate().getTime() - 0, status: status}});
      }
    });


    Meteor.setInterval(function () {
      var offline_threshold = moment().toDate().getTime() - (30*1000);

      UltimateIDEUser.collection.update(
        {last_keepalive: {$lt: offline_threshold}},
        {$set: {status: Statuses.OFFLINE}},
        {multi: true}
      );

    }, 10*1000);
  });
}

if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.setInterval(function() {
      var user = UltimateIDEUser.me();
      if(user) Meteor.call('keepalive', user.username, Statuses.ONLINE);
    }, 10*1000);
  });
}
