var StyleManager = (function() {
    /* global Cc Ci */

    const styleService = Cc['@mozilla.org/content/style-sheet-service;1']
                            .getService(Ci.nsIStyleSheetService);
    const ioService = Cc['@mozilla.org/network/io-service;1']
                         .getService(Ci.nsIIOService);

    const STYLE_TYPE = styleService.USER_SHEET;

    const new_nsiURI = function(uri) {
        return ioService.newURI(uri, null, null);
    };

    let uris = [];

    let load = function(uri) {
        let nsiURI = new_nsiURI(uri);
        if (styleService.sheetRegistered(nsiURI, STYLE_TYPE)) {
            return;
        }
        styleService.loadAndRegisterSheet(nsiURI, STYLE_TYPE);
        uris.push(uri);
    };

    let unload = function(uri) {
        let nsiURI = new_nsiURI(uri);
        if (!styleService.sheetRegistered(nsiURI, STYLE_TYPE)) {
            return;
        }
        styleService.unregisterSheet(nsiURI, STYLE_TYPE);
        let start = uris.indexOf(uri);
        uris.splice(start, 1);
    };

    let destory = function() {
        for (let uri of uris.slice(0)) {
            unload(uri);
        }
        uris = null;
    };

    let exports = {
        load: load,
        unload: unload,
        destory: destory,
    };
    return exports;

})();
