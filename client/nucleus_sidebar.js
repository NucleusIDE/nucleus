/**
 * # NucleusSidebar
 *
 * Singular point of interaction for Sidebar
 */
NucleusSidebar = {
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
      NucleusEditor.removeCursor(NucleusEditor.extraCursors[deadCursor].range);
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
