"use strict";



var forms = {
    initialize: function () {
        this['input:text'].initialize();
        this['input:toggles'].initialize();
        this['form:submit'].initialize();
    },
    tearDown: function() {
        this['input:text'].tearDown();
        this['input:toggles'].tearDown();
        this['form:submit'].tearDown();
    }
};

NucleusEventManager.forms = forms;
