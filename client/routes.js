Meteor.startup(function () {
  var renderNucleusWithoutRouter = function () {
    function detachBody() {
      Template.body.view._domrange.detach(); //detach the dom of body template from page
      Template.body.view._domrange.destroy(); //I don't think this is needed, I just like the sound of it
    }
    detachBody();

    Meteor.subscribe('all_nucleus_users');
    UltimateIDE.initialize({}, window); //initialize the nucleus window
    Template.body.view = Blaze.render(Template.nucleusWorkbench, document.body);  //I have no idea what I am doing
  };

  var setupIronRoutes = function() {
    var Router = Package["iron:router"].Router;

    Router.route('nucleus', {
      path: '/nucleus',
      layoutTemplate: 'nucleusLayout',
      template: 'nucleusWorkbench',
      // waitOn: function() {
      //   return Meteor.subscribe('all_nucleus_users');
      // },
      onBeforeAction: function() {
        UltimateIDE.initialize({}, window); //initialize the nucleus window
        //maybeLoginFromCookie(maybeLoginFromQueryParams);
        this.next();
      }
    });
  };

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
  var maybeLoginFromCookie = function(loginFailCb) {
    var userInfo = JSON.parse($.cookie('nucleus-logged-in-user'));  //get current logged in nucleus user info

    isValidUserInfo(userInfo, function(err, valid) {  //check if nucleus user info stored in cookies is correct
      if (err) {
        console.log("Error occurred while checking nucleus user's login status", err);
        return;
      }

      if (valid) { //log the user in from cookie and hide prompt
        var nucUser = NucleusUsers.findOne({username: userInfo.username});
        Meteor.subscribe('logged_in_nucleus_user', userInfo.username, userInfo.login_token);
        UltimateIDE.currentUser.set(nucUser);
        Session.set('should_show_nucleus_login_button', false);
      } else {
        loginFailCb = loginFailCb || function() {};
        loginFailCb();
      }
    });
  };
  var maybeLoginFromQueryParams = function() {
    var getParam = function(name, url) {
      if (!url) {
        url = window.location.href;
      }
      var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
      if (!results) {
        return undefined;
      }
      return results[1] || undefined;
    };
    var cleanUpURL = function() {
      var cleanUri = window.location.toString().split('?')[0];
      window.history.replaceState({}, document.title, cleanUri);
    };

    var username = getParam('user'),
        loginToken = getParam('login_token'),
        loginFailed = getParam('login_failed') || false,
        message = getParam('message') || "Login Failed";

    if (loginFailed !== 'true' && username && loginToken) {
      var userInfo = {username: username, login_token: loginToken};

      //We can just set the cookie without verifying it here because we navigate to same route again
      //to clear the query params. Then it gets checked in onBeforeAction
      nucleusUserLogin(userInfo);
      maybeLoginFromCookie();
    } else if(loginFailed) {
      FlashMessages.sendError(message);
    }

    cleanUpURL();
  };

  if (! Package["iron:router"]) {
    if (window.location.pathname === '/nucleus') {
      var nucleusRenderInterval = Meteor.setTimeout(function() {
        if (typeof Template.body.view._domrange === 'undefined') return;

        Meteor.clearInterval(nucleusRenderInterval);
        renderNucleusWithoutRouter();

        maybeLoginFromCookie(maybeLoginFromQueryParams);
      }, 200);
    }
    return;
  } else {
    setupIronRoutes();
  }
});
