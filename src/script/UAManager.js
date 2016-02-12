var UAManager = (function() {
    /* global Pref */

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
    };
    return exports;

})();
