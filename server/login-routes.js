/**
 * Server side routes for github oauth
 */
Meteor.startup(function() {
  var Future = Npm.require('fibers/Future');

  var url = Npm.require('url');

  process.env.NUCLEUS_GITHUB_CLIENT_ID = 'a799a8fd956a00498c92';
  process.env.NUCLEUS_GITHUB_CLIENT_SECRET = 'a15b09920b546a91724d5611f1df1b25c114bb72';

  // var baseUrl = 'https://nucleus.ngrok.com';
  var authProxyUrl = 'http://localhost.com:4000';
  var baseUrl = '';

  var githubOAuth = Npm.require('github-oauth')({
    githubClient: process.env['NUCLEUS_GITHUB_CLIENT_ID'],
    githubSecret: process.env['NUCLEUS_GITHUB_CLIENT_SECRET'],
    baseURL: authProxyUrl,
    loginURI: '/nucleus-github-login',
    callbackURI: '/github-auth',

    scope: ['user','repo'] // optional, default scope is set to user
  });

  Router.route('nucleus-github-callback', {
    name: 'nucleucGithubLogin',
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
    name: 'nucleucGithubLogin',
    where: 'server',
    action: function() {
      var req = this.request;
      var res = this.response;

      githubOAuth.login(req, res);
      res.end();
    }
  });


  Router.route('', {
    name: 'auth',
    where: 'server',
    action: function() {
      console.log("GOING TO ROUTE NODE");
      var req = this.request,
          res = this.response;

      this.response.next();
    }
  });

});
