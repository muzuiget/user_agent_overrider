var UAManager = (function() {
    /* global Cc Ci Pref */

    const DEFAULT_UA = Cc['@mozilla.org/network/protocol;1?name=http']
                          .getService(Ci.nsIHttpProtocolHandler)
                          .userAgent;

    let pref = Pref('general.useragent.');

    let revert = function() {
        pref.reset('override');
    };

    let change = function(uastring) {
        pref.setString('override', uastring);
    };

    let exports = {
        revert: revert,
        change: change,
        defaultUa: DEFAULT_UA,
    };
    return exports;

})();

/* exported UAManager */
