this.UltimateFile = Ultimate('UltimateFile').extends(UltimateModel, {
  collection: 'ultimateFiles'
});

if (Meteor.isServer) {
  Meteor.publish('ultimateFiles', function() {
    return UltimateFiles.find();
  });

}
