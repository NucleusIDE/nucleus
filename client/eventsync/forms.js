/**
 * # FormEvent
 *
 * Singular point of interaction for form events:
 * * input:text
 * * input:toggles
 * * form:submit
 */

FormsEvent = function(appName) {
  var APP_NAME = appName;
  this.initialize = function () {
    this['input:text'] = new InputTextEvent(APP_NAME);
    this['input:toggles'] = new InputToggleEvent(APP_NAME);
    this['form:submit'] = new FormSubmitEvent(APP_NAME);

    this['input:text'].initialize();
    this['input:toggles'].initialize();
    this['form:submit'].initialize();
  };

  this.tearDown = function() {
    this['input:text'].tearDown();
    this['input:toggles'].tearDown();
    this['form:submit'].tearDown();
  };
};
