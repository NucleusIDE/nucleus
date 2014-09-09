LoginEvent = function(appName) {
  var EVENT_NAME = 'login',
      APP_NAME = appName,
      $window = NucleusClient.getWindow(APP_NAME),
      utils = NucleusEventManager.getUtils(APP_NAME);

  this.initialize = function() {
    this.overRideLoginWithPassword();
    this.overRideLogout();
  };

  this.tearDown = function() {
    this.undoOverRideLoginWithPassword();
    this.undoOverRideLogout();
  };

  this.overRideLoginWithPassword = function() {
    if($window.Meteor.loginWithPassword) {
      $window.Meteor.loginWithPasswordOriginal = $window.Meteor.loginWithPassword;
      $window.Meteor.loginWithPassword = this.syncLogin;
    }
  };

  this.overRideLogout = function() {
    if($window.Meteor.logout) {
      $window.Meteor.logoutOriginal = $window.Meteor.logout;
      $window.Meteor.logout = this.syncLogout;
    }
  };

  this.undoOverRideLoginWithPassword = function() {
    if($window.Meteor.loginWithPassword)
      $window.Meteor.loginWithPassword = $window.Meteor.loginWithPasswordOriginal;
  };

  this.undoOverRideLogout = function() {
    if($window.Meteor.logout)
      $window.Meteor.logout = $window.Meteor.logoutOriginal;
  };

  this.syncLogin = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var ret = $window.Meteor.loginWithPasswordOriginal.apply($window.Meteor, args);

    if (NucleusEventManager.canEmitEvents) {
      var ev = new NucleusEvent();

      ev.setName(EVENT_NAME);
      ev.setAppName(APP_NAME);
      ev.args = args;
      ev.type = 'login';
      ev.broadcast();
    } else {
      NucleusEventManager.canEmitEvents = true;
    }

    return ret;
  };

  this.syncLogout = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var ret = $window.Meteor.logoutOriginal.apply($window.Meteor, args);

    if (NucleusEventManager.canEmitEvents) {
      var ev = new NucleusEvent();

      ev.setName(EVENT_NAME);
      ev.setAppName(APP_NAME);
      ev.args = args;
      ev.type = 'logout';
      ev.broadcast();
    } else {
      NucleusEventManager.canEmitEvents = true;
    }

    return ret;
  };

  this.handleEvent = function(event) {
    NucleusEventManager.canEmitEvents = false;

    var args = event.args;

    if(event.type === 'logout') {
      return $window.Meteor.logout.apply($window.Meteor, args);
    }

    return $window.Meteor.loginWithPasswordOriginal.apply($window.Meteor, args);
  };
};
