var state = new ReactiveDict();

Template.nucleusWorkarea.helpers({
  styles: function() {
    var sidebarWidth = NucleusUI.State.get('sidebarWidth');

    var styles = "margin-left: " + sidebarWidth
          + "px; width: calc(100% - "
          + sidebarWidth + "px);";

    return(styles);
  },
  workareaTemplate: function() {
    if (Session.get('nucleus_selected_file')) {
      return 'nucleusEditor';
    }
    //hidden editor is added to the page so that ace will load it's theme, mode etc
    //otherwise there is a blank flash for a split second when a file is selected,
    // which gives feeling of a not-so-solid system
    return "hiddenNucleusEditor";
  }
});
