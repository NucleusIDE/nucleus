"use strict";



var forms = {
    initialize: function () {
        this['input:text'].initialize();
        this['input:toggles'].initialize();
    },
    tearDown: function() {
        this['input:text'].tearDown();
        this['input:toggles'].tearDown();
    }
};

NucleusEventManager.forms = forms;
