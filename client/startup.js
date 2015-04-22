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
      NucleusClient.initialize({}, window); //initialize the nucleus window

      var userInfo = JSON.parse($.cookie('nucleus-logged-in-user'));  //get current logged in nucleus user info

      isValidUserInfo(userInfo, function(err, valid) {  //check if nucleus user info stored in cookies is correct
        if (err) {
          console.log("Error occurred while checking nucleus user's login status", err);
          return;
        }

        if (valid) { //log the user in from cookie and hide prompt
          var nucUser = NucleusUsers.findOne({username: userInfo.username});
          Meteor.subscribe('logged_in_nucleus_user', userInfo.username, userInfo.login_token);
          NucleusClient.currentUser.set(nucUser);
          Session.set('should_show_nucleus_login_button', false);
        }
      });
    },
    onAfterAction: function() {
      var username = this.params['user'],
          loginToken = this.params['login_token'],
          loginFailed = this.params['login_failed'],
          message = this.params['message'] || "Login Failed";

      if (loginFailed !== 'true' && username && loginToken) {
        var userInfo = {username: username, login_token: loginToken};

        //We can just set the cookie without verifying it here because we navigate to same route again
        //to clear the query params. Then it gets checked in onBeforeAction
        nucleusUserLogin(userInfo);
        Router.go('nucleus');
      } else if(loginFailed){
        FlashMessages.sendError(message);
      }

    }
  });
});
