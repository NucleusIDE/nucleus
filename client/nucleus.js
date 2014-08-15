var NucleusClientFactory = function() {
    var fileTree,
        currentFile,
        currentFileContents,
        nucleusClientDep = new Deps.Dependency;

    this.config = {
        nucleusUrl: window.location.origin + '/nucleus',
        windowName: 'Nucleus',
        clientDir: 'client'
    };

    this.configure = function(config) {
        _.extend(this.config, config);
    };

    this.isClientFile = function(filepath) {
        var clientRegex = new RegExp("\/"+this.config.clientDir+"\/");
        return clientRegex.test(filepath);
    };

    this.markDocForEval = function(nucDoc) {
        var filepath = nucDoc.filepath,
            isClientFile = this.isClientFile(filepath);
        if (isClientFile) {
            NucleusDocuments.update({_id: nucDoc._id}, {$set: {shouldEval: true}});
        } else {
            FlashMessages.sendWarning("This file can't be evaled in realtime. Changes will be visible on next deploy.");
        }
    };

    this.unmarkDocForEval = function(nucDoc) {
        NucleusDocuments.update({_id: nucDoc._id}, {$set: {shouldEval: false}});
    };

    this.evalNucleusDoc = function(nucDoc) {
        var filepath = nucDoc.filepath,
            doc = ShareJsDocs.findOne(nucDoc.doc_id),
            newJs = doc.data.snapshot;
        console.log("EVALING", filepath);
    };


    this.initialize = function(config) {
        this.configure(config);

        var url = this.config.nucleusUrl,
            windowName = this.config.windowName,
            nucleusWindow = window.open(url, windowName, 'height=550,width=900');

        if (window.focus) { nucleusWindow.focus(); }

        FlashMessages.configure({
            autoHide: true,
            hideDelay: 3000,
            autoScroll: true
        });

        LiveUpdate.configure({
            cssOnly: false
        });

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
        var selectedDocId = Session.get("nucleus_selected_doc_id"),
            nucDoc = NucleusDocuments.findOne({doc_id:selectedDocId}),
            client = this;
        Meteor.call("nucleusSaveDocToDisk", selectedDocId, function(err, res) {
            if (err) { console.log(err); return;}
            if(res === 0) FlashMessages.sendWarning("No Changes to Save");
            if(res === 1) {client.markDocForEval(nucDoc); FlashMessages.sendSuccess("File Saved Successfully");}
            if(res === 2) FlashMessages.sendError("Something went Wrong when Saving File");
        });
    };

    return this;
};

Deps.autorun(function() {
    Meteor.subscribe('nucleusPublisher');
    console.log("FOLLOWING DOCS SHOULD BE EVALED");
    NucleusDocuments.find({shouldEval: true}).forEach(function(doc) {
        NucleusClient.evalNucleusDoc(doc);
        NucleusClient.unmarkDocForEval(doc);
    });
});


NucleusClient = new NucleusClientFactory();
