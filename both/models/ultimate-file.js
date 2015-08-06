this.UltimateFile = Ultimate('UltimateFile').extends(UltimateModel, {
  collection: 'ultimateFiles'
});

if (Meteor.isServer) {
  Meteor.publish('ultimateFiles', function() {
    return UltimateFiles.find();
  });

  this.UltimateFiles.allow({
    insert: function() {
      return true;
    },
    update: function() {
      return true;
    },
    remove: function() {
      return true;
    }
  });

}
