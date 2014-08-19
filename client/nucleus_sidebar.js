NucleusSidebar = {
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
