var state = new ReactiveDict();

Template.nucleusWorkarea.helpers({
  styles: function() {
    Utils.poll(function() {
      var sidebarWidth = $(".nucleus-workbench .sidebar").width();

      if(!sidebarWidth)
        state.set('styles',
                  "margin-left: 0; width: 100%");
      else
        state.set('styles',
                  "margin-left: " + sidebarWidth
                  + "px; width: calc(100% - "
                  + sidebarWidth + "px);");
    }, 100);


    return state.get('styles');
  }
});
