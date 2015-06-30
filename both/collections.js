/**
 * # Collections
 * ##  that aren't converted to models.
 */

//`mizzao:sharejs` package uses two collections `docs` and `ops`
// `docs` collection saves documents that we edit in the ace editor
NucleusGlobal.ShareJsDocs = ShareJsDocs = new Meteor.Collection('docs');
//`ops` collection saves the operations that are performed on the documents in `docs` collection
NucleusGlobal.ShareJsOps = ShareJsOps = new Meteor.Collection('ops');
