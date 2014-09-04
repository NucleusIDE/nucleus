var EVENT_NAME = 'login';
var $window = NucleusClient.getAppWindow();

var login = {
    initialize: function() {
        this.overRideLoginWithPassword();
        this.overRideLogout();
    },
    tearDown: function() {
        this.undoOverRideLoginWithPassword();
        this.undoOverRideLogout();
    },
    overRideLoginWithPassword: function() {
        if($window.Meteor.loginWithPassword) {
            $window.Meteor.loginWithPasswordOriginal = $window.Meteor.loginWithPassword;
            $window.Meteor.loginWithPassword = this.syncLogin;
        }
    },
    overRideLogout: function() {
        if($window.Meteor.logout) {
            $window.Meteor.logoutOriginal = $window.Meteor.logout;
            $window.Meteor.logout = this.syncLogout;
        }
    },
    undoOverRideLoginWithPassword: function() {
        if($window.Meteor.loginWithPassword)
            $window.Meteor.loginWithPassword = $window.Meteor.loginWithPasswordOriginal;
    },
    undoOverRideLogout: function() {
        if($window.Meteor.logout)
            $window.Meteor.logout = $window.Meteor.logoutOriginal;
    },
    syncLogin: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        console.log("LOGIN ARGS ARE", args);
        var ret = $window.Meteor.loginWithPasswordOriginal.apply($window.Meteor, args);

        if (NucleusEventManager.canEmitEvents) {
            var ev = new NucleusEvent();

            ev.setName(EVENT_NAME);
            ev.args = args;
            ev.type = 'login';
            ev.broadcast();
        } else {
            NucleusEventManager.canEmitEvents = true;
        }

        return ret;
    },
    syncLogout: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var ret = $window.Meteor.logoutOriginal.apply($window.Meteor, args);

        if (NucleusEventManager.canEmitEvents) {
            var ev = new NucleusEvent();

            ev.setName(EVENT_NAME);
            ev.args = args;
            ev.type = 'logout';
            ev.broadcast();
        } else {
            NucleusEventManager.canEmitEvents = true;
        }

        return ret;
    },
    handleEvent: function(event) {
        NucleusEventManager.canEmitEvents = false;

        var args = event.args;

        if(event.type === 'logout') {
            return $window.Meteor.logout.apply($window.Meteor, args);
        }

        return $window.Meteor.loginWithPasswordOriginal.apply($window.Meteor, args);
    }
};

NucleusEventManager[EVENT_NAME] = login;
