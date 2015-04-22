/**
 * # Templates
 */

ReactiveVar.prototype.toggle = function() {
  var val = this.get();
  this.set(! val);
};

var LocalReactiveVars = {
  shouldShowDeployForm: new ReactiveVar(false),
  deployToMeteor: new ReactiveVar(true),
  customDeployFormSchema: new ReactiveVar(new SimpleSchema)
};

Template.nucleus.helpers({
  showNucleus: function() {
    return true;
  }
});

//Set the maxHeight of jstree so it won't take all the space when expanded. It make a cool effect
Template.nucleus_tree_widget.rendered = function() {
  $("#nucleus_file_tree").css({maxHeight: ($(window).height()*50)/100});
};

Template.nucleus_login_prompt.helpers({
  no_nuc_user: function() {
    Session.setDefault('should_show_nucleus_login_button', true);
    return Session.get('should_show_nucleus_login_button');
  },
  githubAuthProxyURL: function() {
    return MasterConfig.githubLoginProxy.url + '?subdomain=' + window.location.href.split('/',3).join('/');
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

Template.editor.config = function () {
  return function(editor) {
    // This method gets called when sharejs has initialized the ace-editor. `editor` argument here is the ace-instance provided by sharejs. We use it to initialize `NucleusEditor`
    NucleusEditor.initialize(editor);
  };
};
Template.editor.setMode = function() {
  return function(editor) {
    /**
     * This function is called by sharejs whenever the document being edited in ace changes.
     * We do not set the mode here because it is done in NucleusEditor.initialize
     * NucleusEditor.initialize gets called everytime the doc being editted changes.
     * This is done by sharejs, we simply change the session key for doc and sharejs
     * changes the actual doc for us, and it does it such that editor gets initialized again,
     * everytime
     */
    var selectedFile = Session.get("nucleus_selected_file");

    //Events get unregistered on document change
    NucleusEditor.registerAllEvents();
    NucleusEditor.editor.scrollToRow(0);
  };
};

Template.editor.helpers({
  is_deploying: function() {
    return LocalReactiveVars.shouldShowDeployForm.get();
  },
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
  },
  shouldShowVideoControls: function() {
    return (typeof NucleusClient.WebRTCCall !== 'undefined');
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

    var nucleusUser = NucleusUser.me(),
        commitAuthor = {
          name: nucleusUser.github_data.name,
          email: nucleusUser.email
        };

    console.log("Commit author", commitAuthor);

    Meteor.call("nucleusCommitAllChanges",
                commitMessage,
                Session.get("nucleus_selected_file"),
                commitAuthor,
                function(err, res) {
                  unSpinBtn($btn, btnClasses);
                  if (res === 1) {
                    FlashMessages.sendSuccess("Changes Committed Successfully");
                    $("#sidebar-commit-message").val("");
                  }
                  else if (res === 0) FlashMessages.sendWarning("Nothing to Commit");
                  else FlashMessages.sendError("Something Went Wrong with Git Commit");
                });
  },
  "click #push_changes": function(e) {
    var $btn = $("#push_changes");
    var btnClasses = $btn.find('i').attr('class');
    spinBtn($btn);

    var nucleusUser = NucleusUser.me();

    var githubUser = {
      username: nucleusUser.username,
      loginToken: nucleusUser.login_tokens[0].token
    };

    Meteor.call(
      "nucleusPushChanges",
      Session.get("nucleus_selected_file"),
      githubUser,
      function(err, res) {
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
  "click #nuc_deploy": function(e) {
    e.preventDefault();
    LocalReactiveVars.shouldShowDeployForm.toggle();
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
    NucleusClient.Terminal.toggle();
  }
});
////////////////
// END TOPBAR //
////////////////


////////////////////
// START TERMINAL //
////////////////////
Template.terminal.helpers({
  show_terminal: function() {
    // return NucleusClient.Terminal.showingTerminal.get();
    return Session.get('nucleus_show_terminal');
  },
  terminal_initialized: function() {
    return Session.get('nucleus_terminal_ready');
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
    NucleusClient.popup();
  }
});
/////////////////////////
// end nucleus ribbon  //
/////////////////////////


//////////////////////////
// START VIDEO CONTROLS //
//////////////////////////
Template.nucleus_video_chat_controls.helpers({
  "chat_start_stop_icon": function() {
    if (Session.get('vibrate-chat-active')) {
      return 'fa-stop';
    }
    return 'fa-video-camera';
  }
});

Template.nucleus_video_chat_controls.events({
  "click #start-video-chat": function(e) {
    Session.set('webrtc-chat-active', ! Session.get('webrtc-chat-active'));
  }
});

Template.nucleus_video_chat_film.helpers({
  "show_video_chat_film": function() {
    return Session.get('webrtc-chat-active');
  }
});

Template.nucleus_video_chat_controls.rendered = function() {
  NucleusClient.WebRTCCall.startListeningForIncomingCalls();
};

////////////////////////
// END VIDEO CONTROLS //
////////////////////////


/////////////////////////////////
// START NUCLEUS MASTER PROMPT //
/////////////////////////////////
Template.nucleus_master_prompt.helpers({
  nucleus_show_master_prompt: function() {
    if (typeof NucleusClient.MasterPrompt === 'undefined') return false;

    Meteor.setTimeout(function() {
      $('#nucleus-master-prompt-input').focus();
    }, 100);

    return NucleusClient.MasterPrompt.showPrompt.get();
  },
  results: function() {
    if (! NucleusClient.MasterPrompt.promptOut.get().length)
      return [];

    var res = NucleusClient.MasterPrompt.promptOut.get().map(function(item, index) {
      return _.extend(item, {index: index});
    });

    return res;
  },
  selected_item_class: function() {
    var className = 'nucleus-master-prompt-active';
    return this.index == NucleusClient.MasterPrompt.selectedPromptItem.get() ? className : '';
  }
});

Template.nucleus_master_prompt.events({
  'keyup #nucleus-master-prompt-input': function(e) {
    e.preventDefault();

    var special_keys = [
      27, //esc
      9, //'tab'
      38, //up
      40, //down
      37, //left
      39, //right
    ];

    switch(e.keyCode) {
    case 27:
      NucleusClient.MasterPrompt.hidePrompt();
      break;
    case 38:
      NucleusClient.MasterPrompt.selectedPromptItem.dec();
      break;
    case 40:
      NucleusClient.MasterPrompt.selectedPromptItem.inc();
      break;
    case 13:
      var selectedVal = NucleusClient.MasterPrompt.promptOut.get()[NucleusClient.MasterPrompt.selectedPromptItem.get()].value;
      NucleusClient.MasterPrompt.itemSelected(selectedVal);
      NucleusClient.MasterPrompt.hidePrompt();
      break;
    }

    if (_.contains(special_keys, e.keyCode)) {
      return;
    }

    var val = e.currentTarget.value;
    NucleusClient.MasterPrompt.promptIn.set(val);
  },
  'click .nucleus-master-prompt li': function(e) {
    e.preventDefault();
    NucleusClient.MasterPrompt.itemSelected(e.currentTarget.getAttribute('data-value'));
    NucleusClient.MasterPrompt.hidePrompt();
  },
  'mouseover .nucleus-master-prompt li': function(e) {
    var index = parseInt(e.currentTarget.getAttribute('data-index'));
    NucleusClient.MasterPrompt.selectedPromptItem.set(index);
  }
});

/////////////////////////////////
//  END NUCLEUS MASTER PROMPT //
/////////////////////////////////

///////////////////////
// START DEPLOY FORM //
///////////////////////

Template.nucleus_deploy_form.helpers({
  deploying_to_meteor: function() {
    return LocalReactiveVars.deployToMeteor.get();
  },
  meteorDeployClass: function() {
    return LocalReactiveVars.deployToMeteor.get() ? 'nucleus-deploy-active' : '';
  },
  customDeployClass: function() {
    return LocalReactiveVars.deployToMeteor.get() ? '' : 'nucleus-deploy-active';
  }
});
Template.nucleus_deploy_form.events({
  "click .meteor-deploy": function(e) {
    LocalReactiveVars.deployToMeteor.set(true);
  },
  "click .custom-deploy": function(e) {
    LocalReactiveVars.deployToMeteor.set(false);
    NucleusClient.Deploy.getMupSimpleSchema(function(err, mupSchema) {
      if (err) {
        console.log("Error while getting Mup.json schema", err);
        return err.message;
      }
      console.log("SCHEMA IS", mupSchema);
      LocalReactiveVars.customDeployFormSchema.set(mupSchema);
    });
  },
  "click .nucleus-deploy-form-submit-button, submit #deploy-form": function(e) {
    e.preventDefault();

    var activeForm = LocalReactiveVars.deployToMeteor.get() ? 'meteor' : 'mup',
        options = {};

    if (activeForm === 'meteor') {
      options.subdomain = document.getElementById("nucleus-deploy-subdomain").value.trim();

      if (Utils.isEmpty(options)) {
        FlashMessages.sendError("Please Fill all fields");
        return false;
        b}
    }

    NucleusClient.Deploy.sendDeployCommand(activeForm, options);
  }
});

Template.deploy_form_custom.helpers({
  formSchema: function() {
    var schema = LocalReactiveVars.customDeployFormSchema.get();
    return schema;
  }
});

AutoForm.hooks({
  'customDeployForm': {
    onSubmit: function(insertDoc, updateDoc, currentDoc) {
      var mup = insertDoc;
      _.each(mup, function(val, prop) {
        insertDoc[prop] = JSON.parse(val);
      });

      Meteor.call("nucleusSaveMupJson", mup, function(err, res) {
        if (err)
          throw new Meteor.Error("Error while saving mup", err);

        console.log("Launching terminal and sending mup command");
      });

      return false;
    }
  }
});

//////////////////////
// END DEPLOY FORM  //
//////////////////////

/////////////////////////
// Server busy spinner //
/////////////////////////
Template.nucleus_server_busy.helpers({
  server_is_busy: function() {
    return Meteor.connection.status().status === 'connecting';
  }
});
//////////////////////////////
// END Server busy spinner //
////////////////////////////
