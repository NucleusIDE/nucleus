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

  function fuzzy_match(text, search) {
    /*
     Parameter text is a title, search is the user's search
     */
    // remove spaces, lower case the search so the search
    // is case insensitive
    var search = search.replace(/\ /g, '').toLowerCase();
    var tokens = [];
    var search_position = 0;

    // Go through each character in the text
    for (var n=0; n<text.length; n++)
    {
      var text_char = text[n];
      // if we match a character in the search, highlight it
      if(search_position < search.length &&
         text_char.toLowerCase() == search[search_position])
      {
        // text_char = '<b>' + text_char + '</b>';
        search_position += 1;
      }
      tokens.push(text_char);
    }
    // If are characters remaining in the search text,
    // return an empty string to indicate no match
    if (search_position != search.length)
    {
      return '';
    }
    return tokens.join('');
  }

  return this.fileList.filter(function(text) {
    return fuzzy_match(text, term);
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
