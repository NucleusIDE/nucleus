/**
 * # Collections
 * ##  that aren't converted to models.
 */

//`mizzao:sharejs` package uses two collections `docs` and `ops`
// `docs` collection saves documents that we edit in the ace editor
NucleusGlobal.ShareJsDocs = ShareJsDocs = new Meteor.Collection('docs');
//`ops` collection saves the operations that are performed on the documents in `docs` collection
NucleusGlobal.ShareJsOps = ShareJsOps = new Meteor.Collection('ops');

//`nucleus_documents` collection is used for keeping track of docs in `docs` collection and files on the filesystem.
//`sharejs` overwrites the documents in `docs` collection so we can't simply insert the tracking in them.
NucleusGlobal.NucleusDocuments = NucleusDocuments = new Meteor.Collection('nucleus_documents');

if(Meteor.isServer) NucleusGlobal.ShareJS = ShareJS;
