/*global Files, UltimateModel */

this.Files = function() {
  this.setupFilesModel();
};

Files.prototype.setupFilesModel = function() {
  Meteor.subscribe('ultimateFileTree');
  this.file = Ultimate('UltimateFileTree').extends(UltimateModel, {
    collection: 'ultimateFileTree'
  });
  this.tree = this.file.collection;
};
