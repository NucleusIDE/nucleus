//Publishes all the collections required by nucleus with no limits or checks
Meteor.publish("nucleusPublisher",function() {
  return [
    NucleusDocuments.find({}),
    ShareJsDocs.find({}),
    NucleusEvents.find({})
  ];
});

Meteor.publish("all_nucleus_users", function() {
  var users = NucleusUsers.find({}, {fields: {github_data: 0, login_tokens: 0}});
  return users;
});

Meteor.publish("logged_in_nucleus_user", function(username, loginToken) {
  var userCursor = NucleusUsers.find({username: username}),
      user = userCursor.fetch()[0];

  if (typeof user !== 'undefined' && user.hasValidLoginToken(loginToken)) {
    return userCursor;
  }

  return false;
});
