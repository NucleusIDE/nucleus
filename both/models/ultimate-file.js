this.UltimateFile = Ultimate('UltimateFile').extends(UltimateModel, {
  collection: 'ultimateFiles'
});

if (Meteor.isServer) {
  Meteor.publish('ultimateFiles', function() {
    return UltimateFiles.find();
  });


  UltimateFiles.find({edit: true}).observe({
    changed: function(newDoc, oldDoc) {
      if(newDoc.edit === true) {
        /**
         * Observer to set files for edit. Just put `doc.edit=true` on client to set a file
         * for editting
         *
         * forceRefresh: Sometime it is required to discard the changes in db and force-load
         * the file from fs. For that, update the `UltimateDoc` with
         * `{edit: true, force_refresh: true}`
         */
        var sharejsDocId = UltimateIDE.Files.setupFileForEditting(newDoc);

        newDoc.edit = null;
        newDoc.force_refresh = null;
        newDoc.sharejs_doc_id = sharejsDocId;

        newDoc.save();
      }
    }
  });

}
