/**
 * # Utils
 * Generic utility methods which can be used on both client and server.
 */

this.Utils = {
  getItems: function(obj) {
    /**
     * Returns array of all the items/values in the `obj`
     *
     */
    return _.map(Object.keys(obj), function(key) {
      return obj[key];
    });
  },

  getRandomColor: function() {
    /**
     * Generates a random color. Used for getting colors for new users.
     */
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },
  getComplementoryColor: function(color_in_hex) {
    /**
     * Returns complementary color for `color_in_hex`. This is used to get color for the text to be shown in the label in the ace editor.
     * It returns color which would be visible with `color_in_hex` background.
     *
     * _Arguments:_
     * * `color_in_hex`: Color in hex (like #f3f) whose complementary color is needed
     */
    if(color_in_hex.length === 4) {
      var hex = color_in_hex;
      color_in_hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    color_in_hex = color_in_hex.replace('#', '');

    var complementory = ('000000' + (('0xffffff' ^ '0x'+ color_in_hex).toString(16))).slice(-6);

    return '#'+complementory;
  },
  shortenText: function(str, max, mode) {
    if(!str) return false;
    mode = mode || 'normal';

    if (str.length > max) {
      if(mode == 'middle')
        return str.substr(0, parseInt(max/2)-3) + '...' + str.substr(str.length-parseInt(max/2), str.length);
      if(mode == 'inverted')
        return '...' + str.substr(str.length-(max-3), max);
    }
    return str;
  },
  getExt: function(filepath) {
    var splitArr = filepath.split('.').reverse();    //if there was no `.` in filepath, it will still return an array of length 1

    if (splitArr.length > 1) {
      return splitArr[0];
    }

    return null;
  },
  isEmpty: function(str) {
    /**
     * Return if str is empty. If str is an object, return if any of its keys is empty
     */
    if (R.type(str) === 'Object')
      return R.values(str).length ? R.any(R.isEmpty)(R.values(str)) : false;

    return R.isEmpty(str);
  },
  rAdd: function(dict, key, val, isNum) {
    /**
     * Reactive add. Add 'val' to present val of dict
     */
    var oldVal = dict.get(key) || (isNum ? 0 : '');
    dict.set(key, oldVal + val);
  },
  rReplace: function(dict, key, oldVal, newVal) {
    /**
     * Replace `oldVal` with `newVal` in reactive-dict `dict`'s `key`
     */
    var val = dict.get(key);
    val = val.replace(oldVal, newVal);
    dict.set(key, val);
  },
  rToggle: function(dict, key) {
    /**
     * Toggle boolean `key` of reactive-dict `dict`
     */
    dict.set(key, ! dict.get(key));
  },
  dictToObj: function(dict) {
    var obj = {};
    _.each(dict.keys, function(val, key) {
      obj[key] = dict.get(key);
    });

    return obj;
  },
  when: function(condition, cb, interval, maxTime, immediate) {
    interval = interval || 100;
    maxTime = maxTime || 3000;
    immediate = typeof immediate === 'undefined' ? true : immediate;

    if(typeof condition !== 'function') {
      var check = !!condition;
      condition = function() { return check; };
    }

    if(immediate)
      if(condition())
        return cb();

    var timeSpent = 0;
    var whenInterval = Meteor.setInterval(function() {
      timeSpent += interval;
      if(!condition()) {
        if(timeSpent >= maxTime) Meteor.clearInterval(whenInterval);
        return;
      }

      Meteor.clearInterval(whenInterval);
      cb();
    }, interval);
  },
  capitalizeFirstLetter: function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  throttled: function(func, time, context, args) {
    time = time || 300;
    args = args || [];
    context = context || {};

    var _timeout = null;
    return function() {
      if (_timeout)
        Meteor.clearTimeout(_timeout);

      _timeout = Meteor.setTimeout(function() {
        func.apply(context, args);
      }, time);
    };
  }
};
