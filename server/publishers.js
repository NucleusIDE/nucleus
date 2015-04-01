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
