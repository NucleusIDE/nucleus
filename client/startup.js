Meteor.startup(function () {
  var nucleusUserLogin = function(user) {
    $.cookie('nucleus-logged-in-user', JSON.stringify(user));
  };

  var isValidUserInfo = function(user, cb) {
    if (! user)
      return cb(null, false);

    Meteor.call('nucleusCheckUserToken', user, function(err, res) {
      return cb(err, res);
    });
  };

  Router.route('nucleus', {
    path: '/nucleus',
    layoutTemplate: 'nucleus',
    waitOn: function() {
      return Meteor.subscribe('all_nucleus_users');
    },
    onBeforeAction: function() {
      NucleusClient.initialize({}, window);

      var userInfo = JSON.parse($.cookie('nucleus-logged-in-user'));

      isValidUserInfo(userInfo, function(err, valid) {
        if (err) {
          console.log("Error occurred while checking nucleus user's login status", err);
          return;
        }

        if (valid) {
          console.log("IS userinfo valid? ", valid);
          Meteor.subscribe('logged_in_nucleus_user', userInfo.username, userInfo.login_token);
          NucleusClient.currentUser.set(NucleusUsers.findOne({username: userInfo.username}));
          Session.set('should_show_nucleus_login_button', false);
        }
      });
    },
    onAfterAction: function() {
      var username = this.params['user'],
          loginToken = this.params['login_token'];

      if (username && loginToken) {
        var userInfo = {username: username, login_token: loginToken};

        //We can just set the cookie without verifying it here because we navigate to same route again
        //to clear the query params. Then it gets checked in onBeforeAction
        nucleusUserLogin(userInfo);
        Router.go('nucleus');
      }
    }
  });

  Router.route('test', {
    path: '/test',
    action: function() {
      this.render('nucleus_topbar');
    },
    onAfterAction: function() {
      console.log("ROUTER AFTER ACTION");
      var username = this.params['username'],
          loginToken = this.params['login_token'];

      if (username && loginToken) {
        console.log("UN LT", username, loginToken);

        Router.go('test');
      }
    }
  })


});
