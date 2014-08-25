//mostly copied from browser-sync
var getWindow = function() {
    return NucleusClient.getAppWindow();
};
var getDocument = function() {
    return getWindow().document;
};


NucleusEventManager.utils = {
    /**
     * Cross-browser scroll position
     * @returns {{x: number, y: number}}
     */
    getBrowserScrollPosition: function () {

        var $window   = getWindow();
        var $document = getDocument();
        var scrollX;
        var scrollY;
        var dElement = $document.documentElement;
        var dBody    = $document.body;

        if ($window.pageYOffset !== undefined) {
            scrollX = $window.pageXOffset;
            scrollY = $window.pageYOffset;
        } else {
            scrollX = dElement.scrollLeft || dBody.scrollLeft || 0;
            scrollY = dElement.scrollTop || dBody.scrollTop || 0;
        }

        return {
            x: scrollX,
            y: scrollY
        };
    },
    /**
     * @returns {{x: number, y: number}}
     */
    getScrollSpace: function () {
        var $document = getDocument();
        var dElement = $document.documentElement;
        var dBody    = $document.body;
        return {
            x: dBody.scrollHeight - dElement.clientWidth,
            y: dBody.scrollHeight - dElement.clientHeight
        };
    },
    /**
     * @param tagName
     * @param elem
     * @returns {*|number}
     */
    getElementIndex: function (tagName, elem) {
        var $document = getDocument();
        var allElems = $document.getElementsByTagName(tagName);
        return Array.prototype.indexOf.call(allElems, elem);
    },
    /**
     * Force Change event on radio & checkboxes (IE)
     */
    forceChange: function (elem) {
        elem.blur();
        elem.focus();
    },
    /**
     * @param elem
     * @returns {{tagName: (elem.tagName|*), index: *}}
     */
    getElementData: function (elem) {
        var tagName = elem.tagName;
        var index   = this.getElementIndex(tagName, elem);
        return {
            tagName: tagName,
            index: index
        };
    },
    /**
     * @param {string} tagName
     * @param {number} index
     */
    getSingleElement: function (tagName, index) {
        var $document = getDocument();
        var elems = $document.getElementsByTagName(tagName);
        return elems[index];
    },
    /**
     *
     */
    getBody: function () {
        var $document = getDocument();
        return $document.getElementsByTagName("body")[0];
    },

    //FIXME: we are not syncing any event which is caused by a script to avoid infinite ping-pong of events.
    // But this also prevents any events triggered by scripts in users' app form getting synced too.
    isOriginalEvent: function(event) {
        var scriptedEvent = event.clientX === 0
                && event.clientY === 0
                && event.layerX === 0
                && event.layerY === 0
                && event.pageX === 0
                && event.pageY === 0;
        return !scriptedEvent;
    }

};
