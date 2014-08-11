var NucleusClientFactory = function() {
    var fileTree,
        currentFile,
        currentFileContents,
        nucleusClientDep = new Deps.Dependency;


    this.curtainUp = function() {
        var url = window.location.origin + '/nucleus',
            windowName = 'Nucleus',
            nucleusWindow = window.open(url, windowName, 'height=200,width=150');

        if (window.focus) { nucleusWindow.focus(); }

        return false;
    };

    this.getFileTree = function() {
        this.setFileTree();
        nucleusClientDep.depend();
        return fileTree;
    };
    this.setFileTree = function() {
        var makeYou = this;
        Meteor.call("nucleusGetFileList", function(err, res) {
            //so that this.getFileTree() won't run infinitely for reactive computations
            if (!_.isEqual(res, fileTree)) {
                nucleusClientDep.changed();
                fileTree = res;
            }
        });
    }.bind(this);

    this.getJstreeJSON = function() {
        //jstree uses a different JSON formatting then produced by MakeMe.getFileList. Here we do the conversion
        var rawtree = this.getFileTree();
        if(! rawtree) return false;
        var setJstreeJSON = function(obj) {
            _.each(obj.children, function(child) {
                if (child.name.indexOf(".") === 0) return;
                jstree.push({"id": child.path, "parent": child.parent, "text": child.name});
                if (obj.type === 'folder') setJstreeJSON(child);
            });
        };
        var jstree = [
            {"id": rawtree.path, "parent": "#", "text": rawtree.name}
        ];
        setJstreeJSON(rawtree);
        return jstree;
    };

    this.editFile = function(filepath) {
        Meteor.call('nucleusSetupFileForEditting', filepath, function(err, res) {
            if (err) { console.log(err); return; }
            console.log("SELECTED DOC ID",res);
            Session.set("nucleus_selected_doc_id", res);
        });
    };

    this.saveSelectedFileToDisk = function() {
        var selectedDocId = Session.get("nucleus_selected_doc_id");
        console.log("SAVING FILE", selectedDocId);
        Meteor.call("nucleusSaveDocToDisk", selectedDocId, function(err, res) {
            if (err) { console.log(err); return;}
        });
    };

    return this;
};


NucleusClient = new NucleusClientFactory();
