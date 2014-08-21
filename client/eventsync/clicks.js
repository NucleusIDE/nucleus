//copied from browser sync
/**
 * This is for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "click";


init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs));
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
NucleusEventSync.syncBrowserEvent = function (event) {
    var elem = event.target || event.srcElement;
    if (elem.type === "checkbox" || elem.type === "radio") {
        NucleusEventSync.utils.forceChange(elem);
        return;
    }
    //below line should put the event in mongodb
    console.log(EVENT_NAME, NucleusEventSync.utils.getElementData(elem));
};


/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
// exports.socketEvent = function (bs, eventManager) {

//     return function (data) {

//         if (bs.canSync(data)) {

//             var elem = NucleusEventSync.utils.getSingleElement(data.tagName, data.index);

//             if (elem) {
//                 exports.canEmitEvents = false;
//                 eventManager.triggerClick(elem);
//             }
//         }
//     };
// };
