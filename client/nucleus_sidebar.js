/**
 * # NucleusSidebar
 *
 * Singular point of interaction for Sidebar
 */
NucleusSidebar = {
  /**
   * Re-draw the filetree in sidebar. We need to update the filetree after changes like creation of new file, rename or deletion of a file.
   * I couldn't figure out a more elegant way to redraw the jstree, so we simply destroy it completely and redraw it.
   *
   * *Arguments:*
   * * `elemId` *{string}*: Id of the element on which `jsTree` is created
   */
  redrawJsTree: function(elemId) {
    $("#"+elemId).html(NucleusClient.getJstreeHTML());
    NucleusClient.jsTree.destroy(true);

    var treeInterval = Meteor.setInterval(function() {
      NucleusClient.jsTree = NucleusSidebar.initializeJsTree(elemId);

      if(Object.getPrototypeOf(NucleusClient.jsTree) !== Object.getPrototypeOf($(document))) {
        Meteor.clearInterval(treeInterval);
      }
    }, 300);
  },
  /**
   * Initialize jstree on `elemId`.
   * It does following operations:
   * * sets the jstree on `elemId`
   * * sets actions to be performed when user click a node
   * * sets context menu for the sidebar i.e creation, deletion and renaming of nodes
   *
   * *Arguments:*
   * * `elemId` *{string}*: Id of the element on which `jsTree` is created
   */
  initializeJsTree: function(elemId) {
    $('#'+elemId).on("select_node.jstree", function(e,data) {
      if(document.getElementById(data.node.id).getAttribute("data-type") === 'folder') {
        if(data.node.state.opened)
          NucleusClient.jsTree.close_node(data.node);
        else
          NucleusClient.jsTree.open_node(data.node);
      }
      if(document.getElementById(data.node.id).getAttribute("data-type") === 'file') {
        Session.set("nucleus_selected_file", data.selected[0]);
      }
    });

    return $('#'+elemId).jstree({
      "plugins" : [ "themes", "contextmenu", "sort"],
      'core' : {
        // <!-- 'data' : NucleusClient.getJstreeJSON(), //this doesn't work when jstree.js is kept in meteor package -->
        'check_callback' : function (operation, node, node_parent, newname, more) {
          // Operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'.
          // In case of 'rename_node' node_position is filled with the new node name
          if (operation === 'rename_node') {
            var oldpath = node.id;
            var path = node.id.split("/");
            path.splice(-1);
            var newpath = path.join("/")+"/"+newname;

            NucleusClient.renameFile(oldpath, newpath, function(err, res) {
              if (err) {
                FlashMessages.sendError("Failed to rename file. " + err);
                return;
              }
              FlashMessages.sendSuccess("File Renamed successfully.");
              NucleusClient.jsTree.set_id(node, newpath);
            });
          }

          else return true;
        },
        'themes': {
          icons: false,
          stripes: false,
          responsive: false,
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
                  //get jstree instance
                  var inst = $.jstree.reference(data.reference),
                      //node on which user has right-clicked
                      obj = inst.get_node(data.reference);
                  var isRootNode = (obj.parents.length === 1);

                  //Create a node as a child or sibling
                  var parentId = inst.get_parent(obj);
                  // We create new node in this parent
                  var parent = inst.get_node(parentId);

                  //If the node on which user has clicked is a folder, set the parent to be that folder
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
          }
        }
      },
      //Allow selecting multiple nodes?
      'multiple': false
    });
  },
  /**
   * Update the status box for `user`.
   * This method is used to update status boxes for users when they switch documents.
   *
   * *Arguments:*
   * * `user` *{NucleusUser}*
   */
  updateUserStatusBox: function(user) {
    var $currNickNode = $("[data-user-nick="+user.getNick()+"]"),
        currentFile = $currNickNode.parent().attr("id");

    if (user && user.getCurrentFilepath() === currentFile) {
      return;
    } else {
      $currNickNode.remove();
    }
    var setStatusBoxMargins = function(li) {
      var offset = $(li).offset().left + 5,
          margin = offset === 0 ? false : offset;
      if(margin) {
        $($(li).find('.user-status-box')[0]).css({"margin-right": margin});
      }
    };

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
        setStatusBoxMargins(li); //this is so that when the status box belongs to a nested filetree node, it won't get hidden
      }
    },100);
  },

  /**
   * Clears the user status boxes in sidebar and multiple user cursors in ace editor for those users who have gone offline. We do some un-reactive DOM manipulation for adding user status boxes and cursors in ace which we need to handle ourselves.
   */
  clearDeadUsers: function(users) {
    users = users || NucleusClient.getOnlineUsers().fetch(); //try to decrease db queries
    var nicks = _.map(users, function(user) {
      return user.getNick();
    });
    var userIds = _.map(users, function(user) {
      return user._id;
    });

    //Clear sidebar
    var nicksNodes = _.map($(".user-status-box"), function(n) {
      return n.getAttribute('data-user-nick');
    });

    var deadNicks = _.difference(nicksNodes, nicks);
    _.each(deadNicks, function(deadNick) {
      $("[data-user-nick="+deadNick+"]").remove();
    });

    //Clear extra cursors of
    var deadUserCursors = _.difference(Object.keys(NucleusEditor.extraCursors), userIds);
    _.each(deadUserCursors, function(deadCursor) {
      NucleusEditor.removeCursor(NucleusEditor.extraCursors[deadCursor]);
    });

    Meteor.setTimeout(function() {
      this.clearExtraStatusBoxes(nicks);
    }.bind(this), 200);
  },
  clearExtraStatusBoxes: function(nicks) {
    //clear extra status boxes for present users
    _.each(nicks, function(nick) {
      var nickNodes = $("[data-user-nick="+nick+"]");
      if(nickNodes.length <= 1) return;
      for(var i = nickNodes.length-1; i > 0; i--)
        nickNodes[i].remove();
    });
  }

};
