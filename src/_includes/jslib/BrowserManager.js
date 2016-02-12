var BrowserManager = (function() {
    /* global trace Cc Ci */

    const windowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
                             .getService(Ci.nsIWindowWatcher);

    const BROWSER_URI = 'chrome://browser/content/browser.xul';

    let listeners = [];

    let onload = function(event) {
        for (let listener of listeners) {
            let window = event.currentTarget;
            window.removeEventListener('load', onload);
            if (window.location.href !== BROWSER_URI) {
                return;
            }
            try {
                listener(window);
            } catch (error) {
                trace(error);
            }
        }
    };

    let observer = {
        observe: function(window, topic) {
            if (topic !== 'domwindowopened') {
                return;
            }
            window.addEventListener('load', onload);
        },
    };

    let run = function(func) {
        let enumerator = windowWatcher.getWindowEnumerator();
        while (enumerator.hasMoreElements()) {
            let window = enumerator.getNext();
            if (window.location.href !== BROWSER_URI) {
                continue;
            }

            try {
                func(window);
            } catch (error) {
                trace(error);
            }
        }
    };

    let addListener = function(listener) {
        listeners.push(listener);
    };

    let removeListener = function(listener) {
        let start = listeners.indexOf(listener);
        if (start !== -1) {
            listeners.splice(start, 1);
        }
    };

    let initialize = function() {
        windowWatcher.registerNotification(observer);
    };

    let destory = function() {
        windowWatcher.unregisterNotification(observer);
        listeners = null;
    };

    initialize();

    let exports = {
        run: run,
        addListener: addListener,
        removeListener: removeListener,
        destory: destory,
    };
    return exports;
})();

/* exported BrowserManager */
