/**
 * # Templates
 */

Template.nucleus.helpers({
  showNucleus: function() {
    console.log("NUCLEUS URL IS", NucleusClient.config.nucleusUrl);
    return true;
  }
});


//Set the height of sidebar to be the height of window. I couldn't get it working in CSS
Template.nucleus_sidebar.rendered = function() {
  $("#sidebar").height($(window).height());
};
//Set the maxHeight of jstree so it won't take all the space when expanded. It make a cool effect
Template.nucleus_tree_widget.rendered = function() {
  $("#nucleus_file_tree").css({maxHeight: ($(window).height()*50)/100});
};
Template.nucleus_nick_prompt.rendered = function() {
  if($.cookie('nick')) NucleusUser.new($.cookie('nick'));

  //This is just a remider in case we change css in stylesheet and keyup handler in events fuck up styles on error/success
  $("#nick").css({
    boxShadow: "0 0 29px 0px rgba(17,153,230, 0.9)",
    border: "1px solid rgba(17,153,230,0.5)"
  });
  $("#nick").focus();
};





Template.nucleus_nick_prompt.helpers({
  no_nuc_user: function() {
    return !NucleusUser.me();
  }
});

Template.nucleus_nick_prompt.events({
  "blur #nick": function() {
    $("#nick").focus();
  },
  "keyup #nick": function(e) {
    e.preventDefault();
    var $in = $("#nick"),
        nick = $in.val(),
        validNick = nick.length > 3 && ! NucleusUsers.findOne({nick: $in.val()}) && nick.indexOf(" ") < 0;

    if($in.val() === "") {
      $("#nick").css({
        boxShadow: "0 0 29px 0px rgba(17,153,230, 0.9)",
        border: "1px solid rgba(17,153,230,0.5)"
      });
      return false;
    }

    if (!validNick) {
      $("#nick").css({
        boxShadow: "0 0 29px 0px rgba(218, 61, 66, 0.9)",
        border: "1px solid rgba(218, 61, 66,0.5)"
      });
    } else {
      $("#nick").css({
        boxShadow: "0 0 29px 0px rgba(17, 230, 179, 0.9)",
        border: "1px solid rgba(17, 230, 179, 0.5)"
      });
    }

    if (e.keyCode === 13 && validNick) {
      var nucUser = NucleusUser.new(nick);
    }
  }
});

Template.nucleus_tree_widget.helpers({
  tree: function() {
    /**
     * Couldn't do it in `Template.nucleus_tree_widget.rendered` block. This need to be reactive since `NucleusClient.getJstreeHTML()` is reactive
     */
    var treeId = "nucleus_file_tree";

    var treeInterval = Meteor.setInterval(function() {
      if(document.getElementById(treeId).childElementCount >= 1) {
        NucleusClient.jsTree = NucleusSidebar.initializeJsTree(treeId);
        Meteor.clearInterval(treeInterval);
      }
    }, 300);

    return NucleusClient.getJstreeHTML();
  }
});

Template.editor.rendered = function() {
  $("#nucleus_editor").height($(window).height() - 35);
};

Template.editor.config = function () {
  return function(editor) {
    // This method gets called when sharejs has initialized the ace-editor. `editor` argument here is the ace-instance provided by sharejs. We use it to initialize `NucleusEditor`
    NucleusEditor.initilize(editor);
  };
};

Template.editor.setMode = function() {
  return function(editor) {
    /**
     * This function is called by sharejs whenever the document being edited in ace changes.
     */
    var selectedFile = Session.get("nucleus_selected_file"),
        extRe = /(?:\.([^.]+))?$/,
        ext = extRe.exec(selectedFile)[1];
    NucleusEditor.setModeForExt(ext);
    //Events get unregistered on document change
    NucleusEditor.registerAllEvents();
    NucleusEditor.editor.scrollToRow(0);

    //We need to re-assign the window height on document change otherwise editor falls back to height given in css.
    //Sharejs does dom overwrite may be
    Meteor.setTimeout(function() {
      $("#nucleus_editor").height($(window).height() - 35);
    }, 200);
  };
};

Template.editor.helpers({
  docid: function() {
    return Session.get('nucleus_selected_doc_id') || 'scratch';
  }
});

Template.nucleus_toolbar.helpers({
  recievingEvents: function(app) {
    if (NucleusUser.me())
      return  NucleusUser.me().isSyncingEvents(app) ? 'nuc-btn-dark-active': '';
  },
  fa_recievingEvents: function(app) {
    if (NucleusUser.me())
      return  NucleusUser.me().isSyncingEvents(app) ? 'fa-chain': 'fa-chain-broken';
  }
});

var spinBtn = function($el) {
  $el.find('i').attr('class', 'fa fa-spinner fa-1 fa-spin');
};
var unSpinBtn = function($el, newClass) {
  $el.find('i').attr('class', newClass);
};

Template.nucleus_toolbar.events({
  "click #commit_changes": function(e) {
    var $btn = $("#commit_changes");
    var btnClasses = $btn.find('i').attr('class');
    spinBtn($btn);

    var commitMessage = $("#sidebar-commit-message").val();
    if(!commitMessage) {
      unSpinBtn($btn, btnClasses);
      FlashMessages.sendError("Please Enter Commit Message");
      return;
    }

    Meteor.call("nucleusCommitAllChanges", commitMessage, Session.get("nucleus_selected_file"), function(err, res) {
      unSpinBtn($btn, btnClasses);
      if (res === 1) {FlashMessages.sendSuccess("Changes Committed Successfully"); $("#sidebar-commit-message").val("");}
      else if (res === 0) FlashMessages.sendWarning("Nothing to Commit");
      else FlashMessages.sendError("Something Went Wrong with Git Commit");
    });
  },
  "click #push_changes": function(e) {
    var $btn = $("#push_changes");
    var btnClasses = $btn.find('i').attr('class');
    spinBtn($btn);
    Meteor.call("nucleusPushChanges", Session.get("nucleus_selected_file"), function(err, res) {
      unSpinBtn($btn, btnClasses);
      if (res === 1) FlashMessages.sendSuccess("Changes Pushed Successfully");
      else if (res === 0) FlashMessages.sendWarning("Nothing To Push");
      else FlashMessages.sendError("Something Went Wrong With Git Push");
    });
  },
  "click #pull_changes": function(e) {
    var $btn = $("#pull_changes");
    var btnClasses = $btn.find('i').attr('class');
    spinBtn($btn);
    Meteor.call("nucleusPullChanges", Session.get("nucleus_selected_file"), function(err, res) {
      unSpinBtn($btn, btnClasses);
      if (res === 1) FlashMessages.sendSuccess("New Changes Pulled Successfully");
      else if (res === 0) FlashMessages.sendWarning("Already Up-to-date");
      else FlashMessages.sendError("Something Went Wrong While Pulling Changes");
    });
  },
  "click #mup_deploy": function(e) {
    var $btn = $("#mup_deploy");
    var btnClasses = $btn.find('i').attr('class');
    spinBtn($btn);
    e.preventDefault(;)
    var should_mup_setup = true;
    Meteor.call("nucleusMupDeploy", should_mup_setup, function(err, res) {
      unSpinBtn($btn, btnClasses);
      if (res === 1) FlashMessages.sendSuccess("Deployed Successfully");
      else FlashMessages.sendError("Something Went Wrong While Deploying. Please make sure you have mup.json in project root and it has correct settings.");
    });
  },
  "click #sync_app_events": function(e) {
    e.preventDefault();
    NucleusUser.me().toggleEventSync("app");
  },
  "click #sync_nucleus_events": function(e) {
    e.preventDefault();
    NucleusUser.me().toggleEventSync("nucleus");
  }
});


//Autorun to set file for editing when user clicks on a file in sidebar
Deps.autorun(function() {
  var selectedFile = Session.get("nucleus_selected_file");
  if (!selectedFile) return;

  NucleusClient.editFile(selectedFile);
});


//Autorun to update sidebar user state boxes and cursor position for different users
Deps.autorun(function() {
  var users = NucleusClient.getOnlineUsers().fetch();
  NucleusSidebar.clearDeadUsers(users);

  _.each(users, function(user) {
    NucleusSidebar.updateUserStatusBox(user);
    // Below function should execute only When NucleusEditor is initialized with ace instance
    NucleusEditor.getEditor() && NucleusEditor.userAreOnSameFile(NucleusUser.me(), user) && NucleusEditor.updateCursorForUser(user);
  });
});



//////////
// Chat //
//////////

Template.chatbox.events({
  'keyup .chat_input': function(e) {
    e.preventDefault();

    var msg = $(".chat_input").val().trim();
    if (msg === '')
      return;

    if (e.keyCode === 13) {
      NucleusUser.me().sendChat(msg);
      $(".chat_input").val("");
    }
  }
});
var chatCache = [];
var populateChatBox = function(msg) {
  var html = Blaze.toHTML(Blaze.With({nick: msg.sender_name, message: msg.message}, function() { return Template.chat_message; }));
  var elemReadyInterval = Meteor.setInterval(function() {
    var elem = document.getElementsByClassName("chat_history")[0];
    if (elem) {
      $(".chat_history").append(html);
      elem.scrollTop = elem.scrollHeight;
      Meteor.clearInterval(elemReadyInterval);
    }
  }, 300);
};

Deps.autorun(function() {
  var chatMessages = ChatMessages.find({}).fetch();
  var chatIds = _.map(chatMessages, function(msg) {
    return msg._id;
  });

  var newMsgIds = _.difference(chatIds, chatCache);

  _.each(newMsgIds, function(id) {
    chatCache.push(id);
  });

  _.each(newMsgIds, function(id) {
    var msg = ChatMessages.findOne(id);
    populateChatBox(msg);
  });
});

//////////////
// Chat End //
//////////////


///////////////////////////
// START footer-control  //
///////////////////////////

var hideFooterPopup = function() {
  $(".footer_controls .active-box").removeClass("active-box");
  $(".footer_popup").hide();
  Session.set("footer_controls_template", null);
};

Template.footer_controls.helpers({
  footer_popup_template: function() {
    var template = Session.get("footer_controls_template") || null;
    if(!template) {
      hideFooterPopup();
      return null;
    }
    return Template[template];
  },
  activeBox: function(box) {
    var curTemplate = typeof Session.get("footer_controls_template") ==='undefined' ? 'chatbox': Session.get("footer_controls_template");
    return box === curTemplate ? 'active-box' : '';
  }
});


Template.footer_controls.events({
  "click .show_chatbox": function() {
    var curTemplate = Session.get("footer_controls_template");
    if(curTemplate === 'chatbox' || typeof curTemplate === 'undefined') {
      hideFooterPopup();
      return;
    }

    ChatMessages.find({}).forEach(function(msg) {
      populateChatBox(msg);
    });
    $(".footer_popup").show();
    Session.set("footer_controls_template", "chatbox");
  },
  "click .show_buddy_list": function() {
    var curTemplate = Session.get("footer_controls_template");
    if(curTemplate === 'buddy_list') {
      hideFooterPopup();
      return;
    }

    $(".footer_popup").show();
    Session.set("footer_controls_template", "buddy_list");
  }
});

/////////////////////////
// END footer-control  //
/////////////////////////

//////////////////////
// START BUDDY_LIST //
//////////////////////

Template.buddy_list.helpers({
  buddies: function() {
    var users = NucleusClient.getOnlineUsers();
    return users.map(function(user) {
      var filepath = user.getCurrentFilepath();

      var nick = user.getNick()+' (' + Utils.shortenText(filepath, 20, 'inverted')+')';
      nick = Utils.shortenText(nick, 30, 'middle');

      return {
        filepath: filepath,
        nick: nick,
        statusBoxStyle: "background: "+user.getColor()
      };
    });
  }
});

Template.buddy_list.events({
  'click .buddy_detail': function(e) {
    e.preventDefault();
    Session.set("nucleus_selected_file", this.filepath);
  }
});

////////////////////
// END BUDDY_LIST //
////////////////////


//////////////////
// START TOPBAR //
//////////////////
Template.nucleus_topbar.helpers({
  file_dirty: function(btnType) {
    if(btnType === 'save') return "nuc-btn-save";
    else return "nuc-btn-discard";
  }
});

Template.nucleus_topbar.events({
  "click #nucleus_save_file": function() {
    NucleusClient.saveSelectedFileToDisk();
  },
  "click #nucleus_discard_file": function() {
    var selectedFile = Session.get("nucleus_selected_file");
    if (!selectedFile) return;

    console.log("DISCARDING CHANGES");
    NucleusClient.editFile(selectedFile, true);
  },
  "click #nucleus_show_terminal": function() {
    var showTerminal = Session.get("nucleus_show_terminal") || false;
    Session.set("nucleus_show_terminal", !showTerminal);
  }
});
////////////////
// END TOPBAR //
////////////////


////////////////////
// START TERMINAL //
////////////////////
Template.nucleus_terminal.helpers({
  show_terminal: function() {
    return Session.get("nucleus_show_terminal");
  }
});
//////////////////
// END TERMINAL //
//////////////////

//////////////////////////
// START NUCLEUS RIBBON //
//////////////////////////
Template.nucleus_ribbon.rendered = function() {
  var invert = 1;
  Meteor.setInterval(function() {
    invert = invert == 1 ? .45 : 1;
    $(".nucleus-make-me-ribbon-wrapper img").css({
      "opacity": invert
    }
                                                );
  }, 1500);
};

Template.nucleus_ribbon.events({
  "click #nucleus_client_init": function(e) {
    e.preventDefault();
    NucleusClient.initialize();
  }
});
/////////////////////////
// end nucleus ribbon  //
/////////////////////////
