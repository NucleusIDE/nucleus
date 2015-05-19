/**
 * Server side routes for github oauth
 */
Meteor.startup(function() {
  if (! Package["iron:router"]) {
    console.log("You don't have iron-router installed. Not creating nucleus route");
    return;
  }

  var Router = Package["iron:router"].Router;

  var Future = Npm.require('fibers/Future');

  var url = Npm.require('url');

  SecretKeys = SecretKeys || {github: {}};

  var baseUrl = '';

  var githubOAuth = Npm.require('github-oauth')({
    githubClient: SecretKeys.github.client_id,
    githubSecret: SecretKeys.github.client_secret,
    baseURL: MasterConfig.githubLoginProxy.host,
    loginURI: '/nucleus-github-login',
    callbackURI: MasterConfig.githubLoginProxy.route,

    scope: ['user','repo'] // optional, default scope is set to user
  });

  Router.route('nucleus-github-callback', {
    name: 'nucleusGithubCallback',
    where: 'server',
    action: function() {
      var req = this.request;
      var res = this.response;

      var result = githubOAuth.callback(req, res);

      githubOAuth.on('error', function(err) {
        console.log("ERROR OCCURED WHEN GETTING Access_token from github");
        console.log(err);
      });

      githubOAuth.on('token', function(token, res) {
        try {
          var nucUser = NucleusUser.loginWithGithubToken(token);

          var loginToken = nucUser.getLoginToken();
          var url = baseUrl + '/nucleus?user='+nucUser.username+'&login_token='+loginToken;

          res.statusCode = 302;
          res.setHeader('location', url);
          res.end();
        } catch(e) {
          var message = e.error ? e.error : e.message;
          var url = baseUrl + '/nucleus?login_failed=true&message=' + message;

          res.statusCode = 302;
          res.setHeader('location', url);
          res.end();
        }
      }.future());
    }
  });

  Router.route('nucleus-github-login', {
    name: 'nucleusGithubLogin',
    where: 'server',
    action: function() {
      var req = this.request;
      var res = this.response;

      githubOAuth.login(req, res);
      res.end();
    }
  });
});
