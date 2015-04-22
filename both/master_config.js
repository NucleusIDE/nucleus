MasterConfig = {
  githubLoginProxy: {
    host: 'http://ultimate-ide-auth-proxy.meteor.com',
    route: '/github-auth'
  }
};

MasterConfig.githubLoginProxy.url = MasterConfig.githubLoginProxy.host + MasterConfig.githubLoginProxy.route;
