var Pref = function(branchRoot) {
    /* global trace Cc Ci */

    const supportsStringClass = Cc['@mozilla.org/supports-string;1'];
    const prefService = Cc['@mozilla.org/preferences-service;1']
                           .getService(Ci.nsIPrefService);

    const new_nsiSupportsString = function(data) {
        let string = supportsStringClass.createInstance(Ci.nsISupportsString);
        string.data = data;
        return string;
    };

    let branch = prefService.getBranch(branchRoot);

    let setBool = function(key, value) {
        try {
            branch.setBoolPref(key, value);
        } catch (error) {
            branch.clearUserPref(key);
            branch.setBoolPref(key, value);
        }
    };
    let getBool = function(key, defaultValue) {
        let value;
        try {
            value = branch.getBoolPref(key);
        } catch (error) {
            value = defaultValue || null;
        }
        return value;
    };

    let setInt = function(key, value) {
        try {
            branch.setIntPref(key, value);
        } catch (error) {
            branch.clearUserPref(key);
            branch.setIntPref(key, value);
        }
    };
    let getInt = function(key, defaultValue) {
        let value;
        try {
            value = branch.getIntPref(key);
        } catch (error) {
            value = defaultValue || null;
        }
        return value;
    };

    let setString = function(key, value) {
        try {
            branch.setComplexValue(key, Ci.nsISupportsString,
                                   new_nsiSupportsString(value));
        } catch (error) {
            branch.clearUserPref(key);
            branch.setComplexValue(key, Ci.nsISupportsString,
                                   new_nsiSupportsString(value));
        }
    };
    let getString = function(key, defaultValue) {
        let value;
        try {
            value = branch.getComplexValue(key, Ci.nsISupportsString).data;
        } catch (error) {
            value = defaultValue || null;
        }
        return value;
    };

    let reset = function(key) {
        branch.clearUserPref(key);
    };

    let addObserver = function(observer) {
        try {
            branch.addObserver('', observer, false);
        } catch (error) {
            trace(error);
        }
    };
    let removeObserver = function(observer) {
        try {
            branch.removeObserver('', observer, false);
        } catch (error) {
            trace(error);
        }
    };

    let exports = {
        setBool: setBool,
        getBool: getBool,
        setInt: setInt,
        getInt: getInt,
        setString: setString,
        getString: getString,
        reset: reset,
        addObserver: addObserver,
        removeObserver: removeObserver,
    };
    return exports;
};
