FuzzyFindFile = function(NucleusClient) {
  this.NucleusClient = NucleusClient;

  this.fileList = [];

  this.kbd = ['ctrl+p', 'cmd+p']; //required by MasterPrompt

  //Run this.updateFilesList in autorun because it uses NucleusClient.getFileTree which is reactive
  //This will update this.filetree whenever NucleusClient's filetree changes
  Tracker.autorun(this.updateFilesList.bind(this));
};

FuzzyFindFile.prototype.updateFilesList = function() {
  var filetree = this.NucleusClient.getFileTree(),
      filepath = null;
  var getFileList = function(tree) {
    if (!tree)
      return [];

    if (_.isArray(tree)) {
      return tree.map(getFileList);
    }

    if (!tree.children)
      return [];

    if (tree.type === 'file') {
      //we will later filter out all falsy values. We need only files in our list, so
      filepath = tree.path;
    }

    return _.uniq(_.compact(_.flatten([filepath, getFileList(tree.children)])));
  };
  this.fileList = getFileList(filetree);
};

FuzzyFindFile.prototype.fuzzyFind = function(term) {
  if (!this.fileList || !term)
    return false;

  return this.fileList.filter(function(text) {
    var pattern = term.replace(/\s+/g, '').split('').join('.*');
    return text.match(new RegExp(pattern, 'i'));
  }).map(function(filepath) {
    return {display: filepath.split('/').slice(-4).join('/'), value: filepath};
  });
};

/**
 * This method is called by master-prompt when user selects an item
 */
FuzzyFindFile.prototype.itemSelected = function(filepath) {
  NucleusClient.editFile(filepath);
};

FuzzyFindFile.prototype.promptResults = FuzzyFindFile.prototype.fuzzyFind;

FuzzyFindFile.prototype.exec = function() {
  NucleusClient.MasterPrompt.registerPlugin(this);
};
