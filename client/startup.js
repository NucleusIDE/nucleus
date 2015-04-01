Meteor.startup(function () {
  var logInUser = function(user) {
    $.cookie('nucleus-logged-in-user', JSON.stringify(user));
  };

  var userIsLoggedIn = function(cb) {
    var user = JSON.parse($.cookie('nucleus-logged-in-user'));
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
      userIsLoggedIn(function(err, isLoggedIn) {
        if (err) {
          console.log("Error occurred while checking nucleus user's login status", err);
          return;
        }

        if (isLoggedIn) {
          /**
           * We want to remove the `Login With Github` overlay if user has correct tokens. But instead of manually doing so, we simply subscribe to the NucleusUser. This with the help of a helper in template removes the overlay
           */
          Meteor.subscribe('logged_in_nucleus_user');
        }
      });
    },
    onAfterAction: function() {
      if (this.params.query) {
        console.log("QUERY: ", this.params.query);
      }
    }
  });


});
