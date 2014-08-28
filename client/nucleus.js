var NucleusClientFactory = function() {
    var fileTree,
        currentFile,
        currentFileContents,
        nucleusClientDep = new Deps.Dependency;

    this.config = {
        nucleusUrl: window.location.origin + '/nucleus',
        windowName: 'Nucleus',
        clientDir: 'client',
        serverDir: 'server',
        suckCSSFromPackages: []
    };

    this.configure = function(config) {
        _.extend(this.config, config);

        LiveUpdate.configure({
            purelyThirdParty: true
        });

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

        this.nucleusWindow = nucleusWindow;
        this.updateCSS();
        return false;
    };

    this.getScratchDoc = function() {
        return 'scratch';
    };

    this.getWindow = function() {
        return this.nucleusWindow ? this.nucleusWindow : window.name === "Nucleus" ? window : window;
    };

    this.getAppWindow = function() {
        return window.name === "Nucleus" ? window.opener : window;
    };

    this.isClientFile = function(filepath) {
        var clientRegex = new RegExp("\/"+this.config.clientDir+"\/");
        return clientRegex.test(filepath);
    };
    this.isServerFile = function(filepath) {
        var serverRegex = new RegExp("\/"+this.config.clientDir+"\/");
        return serverRegex.test(filepath);
    };
    this.isCSSFile = function(filepath) {
        var splitArr = filepath.split(".");
        return splitArr[splitArr.length-1] === 'css';
    };

    this.markDocForEval = function(nucDoc) {
        var filepath = nucDoc.filepath,
            isClientFile = this.isClientFile(filepath);
        if (isClientFile || !this.isServerFile(filepath) && this.isCSSFile(filepath)) {
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
        if (this.isCSSFile(filepath))
            this.updateCSS();
        else
            console.log("EVALING", filepath);
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

    this.getJstreeHTML = function() {
        //jstree isn't working when used with JSON from within a meteor package. So, let's create HTML (ul>li) instead.
        // I tried creating my own simple tree, but it's turning out to be more work
        var tree = this.getFileTree();
        if (! tree) return false;
        var template = "\
            <ul> \
              <% _.each(tree.children, function(child) { %>  \
                <li id='<%= child.path %>' data-type='<%= child.type %>'><%= child.name %> \
                  <%= childFn({tree: child, childFn: childFn}) %> \
              </li> \
              <% }) %> \
          </ul>";
        var templateFn = _.template(template);

        var html = templateFn({tree: tree, childFn: templateFn});
        return html;
    };

    this.getJstreeJSON = function() {
        //jstree uses a different JSON formatting then produced by Nucleus.getFileList. Here we do the conversion
        var rawtree = this.getFileTree();
        if(! rawtree) return false;
        var setJstreeJSON = function(obj) {
            _.each(obj.children, function(child) {
                if (child.name.indexOf(".") === 0) return; //ignore hidden files/folders
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

            NucleusUser.me().setCwd(res);
            NucleusUser.me().setCurrentFilepath(filepath);
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

    this.updateCSS = function() {
        var nucleusStyle = document.createElement("style"),
            window = this.getAppWindow();
        if(window.document.getElementById("nucleus-style")) window.document.getElementById("nucleus-style").remove();
        nucleusStyle.id = "nucleus-style";

        /*
         * clear old CSS
         * This works because Meteor injects only one stylesheet <link>
         */
        _.each(window.document.querySelectorAll("link"), function(link) {
            if (link.rel === 'stylesheet') link.href = '';
        });

        Meteor.call("nucleusGetAllCSS", {packagesToInclude: this.config.suckCSSFromPackages}, function(err, res) {
            nucleusStyle.innerHTML = res;
            window.document.head.appendChild(nucleusStyle);
        });
    };

    this.getOnlineUsers = function() {
        return NucleusUsers.find();
    };

    this.clearDeadUsers = function(users) {
        users = users || NucleusClient.getOnlineUsers().fetch(); //try to decrease db queries
        var nicks = _.map(users, function(user) {
            return user.getNick();
        });
        var userIds = _.map(users, function(user) {
            return user._id;
        });

        //clear sidebar
        var nicksNodes = _.map($(".user-status-box"), function(n) {
            return n.getAttribute('data-user-nick');
        });
        var deadNicks = _.difference(nicksNodes, nicks);
        _.each(deadNicks, function(deadNick) {
            $("[data-user-nick="+deadNick+"]").remove();
        });

        //clear extra cursors
        var deadUserCursors = _.difference(Object.keys(NucleusEditor.extraCursors), userIds);
        _.each(deadUserCursors, function(deadCursor) {
            NucleusEditor.removeCursor(NucleusEditor.extraCursors[deadCursor]);
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


//this deletes the current user
NucleusClient.getWindow().onbeforeunload = function() {
    console.log("UNLOADING NUCLEUS WINDOW");
    //TODO: REMOVE BELOW LINE WHEN DONE TEsTING
    // NucleusUser.me().delete();
};
