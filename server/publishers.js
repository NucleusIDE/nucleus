//Publishes all the collections required by nucleus with no limits or checks
Meteor.publish(null, function() {
  return [
    ShareJsDoc.collection.find({})
  ];
});

Meteor.publish("all_ultimate_users", function() {
  var users = UltimateIDEUser.collection.find({}, {fields: {github_data: 0, login_tokens: 0}});
  return users;
});

Meteor.publish("logged_in_ultimate_user", function(username, loginToken) {
  var userCursor = UltimateIDEUsers.find({username: username}),
      user = userCursor.fetch()[0];

  if (typeof user !== 'undefined' && user.hasValidLoginToken(loginToken)) {
    return userCursor;
  }

  return false;
});
