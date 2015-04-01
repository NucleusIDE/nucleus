/**
 * Server side routes for github oauth
 */
Meteor.startup(function() {
  var Future = Npm.require('fibers/Future');

  var url = Npm.require('url');

  process.env.NUCLEUS_GITHUB_CLIENT_ID = 'a799a8fd956a00498c92';
  process.env.NUCLEUS_GITHUB_CLIENT_SECRET = 'a15b09920b546a91724d5611f1df1b25c114bb72';

  // var baseUrl = 'https://nucleus.ngrok.com';
  var baseUrl = 'http://localhost:3000';

  var githubOAuth = Npm.require('github-oauth')({
    githubClient: process.env['NUCLEUS_GITHUB_CLIENT_ID'],
    githubSecret: process.env['NUCLEUS_GITHUB_CLIENT_SECRET'],
    baseURL: baseUrl,
    loginURI: '/nucleus-github-login',
    callbackURI: '/nucleus-github-callback',
    scope: 'user' // optional, default scope is set to user
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
        var nucUser = NucleusUser.loginWithGithubToken(token);
        var loginToken = nucUser.getLoginToken();

        console.log("LOGIN TOKEN", loginToken);

        var url = baseUrl + '/nucleus?user='+nucUser.username+'&login_token='+loginToken;

        res.statusCode = 302;
        res.setHeader('location', url);
        res.end();
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

});
