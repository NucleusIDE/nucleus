NucleusSidebar = {
    initializeJsTree: function(elemId) {
        //set events on jstree
        $('#'+elemId).on("select_node.jstree", function(e,data) {
            if(data.node.data.type === 'folder') {
                if(data.node.state.opened)
                    NucleusClient.jsTree.close_node(data.node);
                else
                    NucleusClient.jsTree.open_node(data.node);
            }
            if(data.node.data.type === 'file') {
                Session.set("nucleus_selected_file", data.selected[0]);
            }
        });

        return $('#'+elemId).jstree({
            "plugins" : [ "themes", "contextmenu", "sort"],
            'core' : {
                // 'data' : NucleusClient.getJstreeJSON(), //this doesn't work when jstree.js is kept in meteor package
                check_callback: true,
                'themes': {
                    icons: false,
                    stripes: false,
                    responsive: true,
                    dots: false
                }
            },
            sort: 1,
            contextmenu: {
                select_node: false,
                items : {
                    "create" : {
                        "separator_before"	: false,
                        "separator_after"	: true,
                        "_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
                        "label"				: "New",
                        "submenu" : {
                            "file" : {
                                "separator_before"	: false,
                                "separator_after"	: false,
                                "label"				: "File",
                                "action"			: function (data) {
                                    var inst = $.jstree.reference(data.reference),
                                        obj = inst.get_node(data.reference);
                                    var isRootNode = (obj.parents.length === 1);

                                    console.log("OBJ", obj);

                                    //create a node as a child or sibling

                                    var parentId = inst.get_parent(obj);
                                    var parent = inst.get_node(parentId);

                                    if(document.getElementById(obj.id).getAttribute('data-type') === 'folder') {
                                        parent = obj;
                                        parentId = obj.id;
                                    }

                                    var newNodeId = inst.create_node(parent, {}, 1, function (new_node) {});
                                    var newNode = inst.get_node(newNodeId);
                                    var filename = "untitled";
                                    var newFilepath = parentId === "#" ? filename : parentId + "/" + filename;

                                    NucleusClient.createNewFile(newFilepath, function(err, res) {
                                        if(err) {throw new Error("FILE CREATION ERROR", err);}
                                        console.log("NEW FILE NAME IS", res);
                                        var newFilename = res.split("/")[res.split("/").length - 1];
                                        inst.set_text(newNode, newFilename);
                                        inst.set_id(newNode, res);
                                        document.getElementById(res).setAttribute("data-type", "file");
                                    });
                                }
                            },
                            "folder" : {
                                "separator_before"	: false,
                                "icon"				: false,
                                "separator_after"	: false,
                                "label"				: "Folder",
                                "action"			: function (data) {
                                    var inst = $.jstree.reference(data.reference),
                                        obj = inst.get_node(data.reference);
                                    var isRootNode = (obj.parents.length === 1);

                                    //create a node as a child or sibling

                                    var parentId = inst.get_parent(obj);
                                    var parent = inst.get_node(parentId);

                                    if(document.getElementById(obj.id).getAttribute('data-type') === 'folder') {
                                        parent = obj;
                                        parentId = obj.id;
                                    }

                                    var newNodeId = inst.create_node(parent, {}, 1, function (new_node) {});
                                    var newNode = inst.get_node(newNodeId);
                                    var filename = "untitled_folder";
                                    var newFilepath = parentId === "#" ? filename : parentId + "/" + filename;

                                    NucleusClient.createNewFolder(newFilepath, function(err, res) {
                                        if(err) {throw new Error("FILE CREATION ERROR", err);}
                                        console.log("NEW FOLDER NAME IS", res);
                                        var newFilename = res.split("/")[res.split("/").length - 1];
                                        inst.set_text(newNode, newFilename);
                                        inst.set_id(newNode, res);
                                        document.getElementById(res).setAttribute("data-type", "folder");
                                    });
                                }
                            }
                        }
                    },
                    "rename" : {
                        "separator_before"	: false,
                        "separator_after"	: false,
                        "_disabled"			: false, //(this.check("rename_node", data.reference, this.get_parent(data.reference), "")),
                        "label"				: "Rename",
                        /*
                         "shortcut"			: 113,
                         "shortcut_label"	: 'F2',
                         "icon"				: "glyphicon glyphicon-leaf",
                         */
                        "action"			: function (data) {
                            var inst = $.jstree.reference(data.reference),
                                obj = inst.get_node(data.reference);
                            inst.edit(obj);
                        }
                    },
                    "remove" : {
                        "separator_before"	: false,
                        "icon"				: false,
                        "separator_after"	: false,
                        "_disabled"			: false, //(this.check("delete_node", data.reference, this.get_parent(data.reference), "")),
                        "label"				: "Delete",
                        "action"			: function (data) {
                            var inst = $.jstree.reference(data.reference),
                                obj = inst.get_node(data.reference);
                            var filepath = obj.id;
                            NucleusClient.deleteFile(filepath, function(err, res) {
                                if(err) { FlashMessages.sendError(err); return; }

                                inst.delete_node(obj);

                                var filename = filepath.split("/")[filepath.split("/").length - 1];
                                FlashMessages.sendSuccess(filename + " Successfully Deleted.");
                            });
                        }
                    },
                    // "ccp" : {
                    //     "separator_before"	: true,
                    //     "icon"				: false,
                    //     "separator_after"	: false,
                    //     "label"				: "Edit",
                    //     "action"			: false,
                    //     "submenu" : {
                    //         "cut" : {
                    //             "separator_before"	: false,
                    //             "separator_after"	: false,
                    //             "label"				: "Cut",
                    //             "action"			: function (data) {
                    //                 var inst = $.jstree.reference(data.reference),
                    //                     obj = inst.get_node(data.reference);
                    //                 if(inst.is_selected(obj)) {
                    //                     inst.cut(inst.get_selected());
                    //                 }
                    //                 else {
                    //                     inst.cut(obj);
                    //                 }
                    //             }
                    //         },
                    //         "copy" : {
                    //             "separator_before"	: false,
                    //             "icon"				: false,
                    //             "separator_after"	: false,
                    //             "label"				: "Copy",
                    //             "action"			: function (data) {
                    //                 var inst = $.jstree.reference(data.reference),
                    //                     obj = inst.get_node(data.reference);
                    //                 if(inst.is_selected(obj)) {
                    //                     inst.copy(inst.get_selected());
                    //                 }
                    //                 else {
                    //                     inst.copy(obj);
                    //                 }
                    //             }
                    //         },
                    //         "paste" : {
                    //             "separator_before"	: false,
                    //             "icon"				: false,
                    //             "_disabled"			: function (data) {
                    //                 return !$.jstree.reference(data.reference).can_paste();
                    //             },
                    //             "separator_after"	: false,
                    //             "label"				: "Paste",
                    //             "action"			: function (data) {
                    //                 var inst = $.jstree.reference(data.reference),
                    //                     obj = inst.get_node(data.reference);
                    //                 inst.paste(obj);
                    //             }
                    //         }
                    //     }
                    // }
                }
            },
            'multiple': false
        });
    },
    updateUserStatusBox: function(user) {
        var $currNickNode = $("[data-user-nick="+user.getNick()+"]"),
            currentFile = $currNickNode.parent().attr("id");

        if (user && user.getCurrentFilepath() === currentFile) {
            return;
        } else {
            $currNickNode.remove();
        }

        var interval = Meteor.setInterval(function() {
            var li = document.getElementById(user.getCurrentFilepath());
            if (li) {
                Meteor.clearInterval(interval);
                var i = document.createElement("i");
                i.className = "user-status-box hint--left";
                i.style.cssText = "background:" + user.getColor();
                i.setAttribute('data-user-nick', user.getNick());
                i.setAttribute('data-hint', user.getNick());
                li.appendChild(i);
                i.style.opacity = 0;
                window.getComputedStyle(i).opacity; //this is so the transition b/w opacity of i work
                i.style.opacity = 1;
            }
        },100);
    }
};
