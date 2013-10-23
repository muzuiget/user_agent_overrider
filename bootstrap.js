/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const log = function() { dump(Array.slice(arguments).join(' ') + '\n'); };
const trace = function(error) { log(error); log(error.stack); };
const dirobj = function(obj) { for (let i in obj) { log(i, ':', obj[i]); } };

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

/* library */

const Utils = (function() {

    const sbService = Cc['@mozilla.org/intl/stringbundle;1']
                         .getService(Ci.nsIStringBundleService);
    const windowMediator = Cc['@mozilla.org/appshell/window-mediator;1']
                              .getService(Ci.nsIWindowMediator);

    let localization = function(id, name) {
        let uri = 'chrome://' + id + '/locale/' + name + '.properties';
        return sbService.createBundle(uri).GetStringFromName;
    };

    let setAttrs = function(widget, attrs) {
        for (let [key, value] in Iterator(attrs)) {
            widget.setAttribute(key, value);
        }
    };

    let getMostRecentWindow = function(winType) {
        return windowMediator.getMostRecentWindow(winType);
    };

    let exports = {
        localization: localization,
        setAttrs: setAttrs,
        getMostRecentWindow: getMostRecentWindow,
    };
    return exports;
})();

const StyleManager = (function() {

    const styleService = Cc['@mozilla.org/content/style-sheet-service;1']
                            .getService(Ci.nsIStyleSheetService);
    const ioService = Cc['@mozilla.org/network/io-service;1']
                         .getService(Ci.nsIIOService);

    const STYLE_TYPE = styleService.USER_SHEET;

    const new_nsiURI = function(uri) ioService.newURI(uri, null, null);

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

const BrowserManager = (function() {

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
            } catch(error) {
                trace(error);
            }
        }
    };

    let observer = {
        observe: function(window, topic, data) {
            if (topic !== 'domwindowopened') {
                return;
            }
            window.addEventListener('load', onload);
        }
    };

    let run = function(func, uri) {
        let enumerator = windowWatcher.getWindowEnumerator();
        while (enumerator.hasMoreElements()) {
            let window = enumerator.getNext();
            if (window.location.href !== BROWSER_URI) {
                continue;
            }

            try {
                func(window);
            } catch(error) {
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

const ToolbarManager = (function() {

    /**
     * Remember the button position.
     * This function Modity from addon-sdk file lib/sdk/widget.js, and
     * function BrowserWindow.prototype._insertNodeInToolbar
     */
    let layoutWidget = function(document, button, isFirstRun) {

        // Add to the customization palette
        let toolbox = document.getElementById('navigator-toolbox');
        toolbox.palette.appendChild(button);

        // Search for widget toolbar by reading toolbar's currentset attribute
        let container = null;
        let toolbars = document.getElementsByTagName('toolbar');
        let id = button.getAttribute('id');
        for (let i = 0; i < toolbars.length; i += 1) {
            let toolbar = toolbars[i];
            if (toolbar.getAttribute('currentset').indexOf(id) !== -1) {
                container = toolbar;
            }
        }

        // if widget isn't in any toolbar, default add it next to searchbar
        if (!container) {
            if (isFirstRun) {
                container = document.getElementById('nav-bar');
            } else {
                return;
            }
        }

        // Now retrieve a reference to the next toolbar item
        // by reading currentset attribute on the toolbar
        let nextNode = null;
        let currentSet = container.getAttribute('currentset');
        let ids = (currentSet === '__empty') ? [] : currentSet.split(',');
        let idx = ids.indexOf(id);
        if (idx !== -1) {
            for (let i = idx; i < ids.length; i += 1) {
                nextNode = document.getElementById(ids[i]);
                if (nextNode) {
                    break;
                }
            }
        }

        // Finally insert our widget in the right toolbar and in the right position
        container.insertItem(id, nextNode, null, false);

        // Update DOM in order to save position
        // in this toolbar. But only do this the first time we add it to the toolbar
        if (ids.indexOf(id) === -1) {
            container.setAttribute('currentset', container.currentSet);
            document.persist(container.id, 'currentset');
        }
    };

    let addWidget = function(window, widget, isFirstRun) {
        try {
            layoutWidget(window.document, widget, isFirstRun);
        } catch(error) {
            trace(error);
        }
    };

    let removeWidget = function(window, widgetId) {
        try {
            let widget = window.document.getElementById(widgetId);
            widget.parentNode.removeChild(widget);
        } catch(error) {
            trace(error);
        }
    };

    let exports = {
        addWidget: addWidget,
        removeWidget: removeWidget,
    };
    return exports;
})();

const Pref = function(branchRoot) {

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
        } catch(error) {
            branch.clearUserPref(key)
            branch.setBoolPref(key, value);
        }
    };
    let getBool = function(key, defaultValue) {
        let value;
        try {
            value = branch.getBoolPref(key);
        } catch(error) {
            value = defaultValue || null;
        }
        return value;
    };

    let setInt = function(key, value) {
        try {
            branch.setIntPref(key, value);
        } catch(error) {
            branch.clearUserPref(key)
            branch.setIntPref(key, value);
        }
    };
    let getInt = function(key, defaultValue) {
        let value;
        try {
            value = branch.getIntPref(key);
        } catch(error) {
            value = defaultValue || null;
        }
        return value;
    };

    let setString = function(key, value) {
        try {
            branch.setComplexValue(key, Ci.nsISupportsString,
                                   new_nsiSupportsString(value));
        } catch(error) {
            branch.clearUserPref(key)
            branch.setComplexValue(key, Ci.nsISupportsString,
                                   new_nsiSupportsString(value));
        }
    };
    let getString = function(key, defaultValue) {
        let value;
        try {
            value = branch.getComplexValue(key, Ci.nsISupportsString).data;
        } catch(error) {
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
        } catch(error) {
            trace(error);
        }
    };
    let removeObserver = function(observer) {
        try {
            branch.removeObserver('', observer, false);
        } catch(error) {
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
        removeObserver: removeObserver
    }
    return exports;
};

let UAManager = (function() {

    // There are a bug since Firefox 17, was fixed at Firefox 23
    // https://bugzilla.mozilla.org/show_bug.cgi?id=814379

    let hackingWay = function() {
        // this way work only at Firefox 17 - 24

        Cu.import('resource://gre/modules/UserAgentOverrides.jsm');

        // Orignal UA selector function, a method of UserAgentOverrides.
        // Keep it for revert to default.
        let orignalGetOverrideForURI = UserAgentOverrides.getOverrideForURI;

        let revert = function() {
            UserAgentOverrides.getOverrideForURI = orignalGetOverrideForURI;
        };

        let change = function(uastring) {
            UserAgentOverrides.getOverrideForURI = function() uastring;
        };

        let exports = {
            revert: revert,
            change: change,
        };
        return exports;
    };

    let normalWay = function() {
        // this way work only at Firefox 23+

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
    }

    const appInfo = Cc['@mozilla.org/xre/app-info;1']
                       .getService(Components.interfaces.nsIXULAppInfo);
    let mainVersion = parseInt(appInfo.version.split('.')[0]);
    if (mainVersion < 23) {
        return hackingWay();
    } else {
        return normalWay();
    }

})();

/* main */

let _ = null;
let loadLocalization = function() {
    _ = Utils.localization('useragentoverrider', 'global');
};

let uaEntriesConverter = function(text) {
    let entries = [];
    let lines = text.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }
        let delimiter = line.indexOf(':');
        let label = line.slice(0, delimiter).trim();
        let url = line.slice(delimiter + 1).trim();
        if (label && url) {
            entries.push([label, url]);
        }
    }
    return entries;
};

let UserAgentOverrider = function() {

    const EXTENSION_NAME = 'User Agent Overrider';
    const BUTTON_ID = 'useragentoverrider-button';
    const STYLE_URI = 'chrome://useragentoverrider/skin/browser.css';
    const PREF_BRANCH = 'extensions.useragentoverrider.';

    const ACTIVATED_TOOLTIPTEXT = EXTENSION_NAME + '\n' +
                                  _('activatedTooltip');
    const DEACTIVATED_TOOLTIPTEXT = EXTENSION_NAME + '\n' +
                                    _('deactivatedTooltip');

    const DEFAULT_ENTRIES_STRING = [
        '# Firefox',
        'Firefox 24/Linux: Mozilla/5.0 (X11; Linux x86_64; rv:24.0) Gecko/20100101 Firefox/24.0',
        'Firefox 24/Windows: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0',
        'Firefox 24/Android: Mozilla/5.0 (Android; Mobile; rv:24.0) Gecko/24.0 Firefox/24.0',
        '',
        '# Chrome',
        'Chrome 30/Linux: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
        'Chrome 30/Windows: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
        'Chrome 30/Android: Mozilla/5.0 (Linux; Android 4.3; Nexus 4 Build/JWR66Y) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.82 Mobile Safari/537.36',
        'Chrome 28/iOS: Mozilla/5.0 (iPad; CPU OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) CriOS/28.0.1500.16 Mobile/9B206 Safari/7534.48.3',
        '',
        '# IE',
        'IE 6/Windows: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)',
        'IE 7/Windows: Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
        'IE 8/Windows: Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0)',
        'IE 9/Windows: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        'IE 10/Windows: Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
        '',
        '',
    ].join('\n');

    let config = {
        firstRun: true,
        activated: false,
        entries: [],
        currentLabel: '' // label in entries
    };
    let pref = Pref(PREF_BRANCH);

    let prefObserver;
    let uaHandler;
    let toolbarButtons;

    prefObserver = {

        observe: function(subject, topic, data) {
            this.reloadConfig();
            uaHandler.refresh();
            toolbarButtons.refresh();
        },

        start: function() {
            pref.addObserver(this);
        },
        stop: function() {
            pref.removeObserver(this);
        },

        initBool: function(name) {
            let value = pref.getBool(name);
            if (value === null) {
                pref.setBool(name, config[name]);
            } else {
                config[name] = value;
            }
        },
        initString: function(name) {
            let value = pref.getString(name);
            if (value === null) {
                pref.setString(name, config[name]);
            } else {
                config[name] = value;
            }
        },
        initComplex: function(name, converter, defaultValue) {
            let text = pref.getString(name);
            if (text === null) {
                pref.setString(name, defaultValue);
                config[name] = converter(defaultValue);
            } else {
                config[name] = converter(text);
            }
        },

        loadBool: function(name) {
            let value = pref.getBool(name);
            if (value !== null) {
                config[name] = value;
            }
        },
        loadString: function(name) {
            let value = pref.getString(name);
            if (value !== null) {
                config[name] = value;
            }
        },
        loadComplex: function(name, converter) {
            let text = pref.getString(name);
            if (text !== null) {
                config[name] = converter(text);
            }
        },

        initConfig: function() {
            let {initBool, initString, initComplex} = this;
            initBool('firstRun');
            initBool('activated');
            initComplex('entries', uaEntriesConverter, DEFAULT_ENTRIES_STRING);
            initString('currentLabel');
        },
        reloadConfig: function() {
            let {loadBool, loadString, loadComplex} = this;
            loadBool('firstRun');
            loadBool('activated');
            loadComplex('entries', uaEntriesConverter);
            loadString('currentLabel');
        },
        saveConfig: function() {
            this.stop(); // avoid recursion

            pref.setBool('firstRun', false);
            pref.setBool('activated', config.activated);
            pref.setString('currentLabel', config.currentLabel);

            this.start();
        }
    };

    uaHandler = {
        revert: function() {
            UAManager.revert();
        },
        refresh: function() {
            let {activated, entries, currentLabel} = config;
            if (!activated || !currentLabel) {
                UAManager.revert();
                return;
            }

            // change to the newsest uastring
            for (let [label, uastring] of entries) {
                if (label === currentLabel) {
                    UAManager.change(uastring);
                    return;
                }
            }

            // the last current label has removed, revert default
            config.activated = false;
            config.currentLabel = '';
            prefObserver.saveConfig();
            UAManager.revert();
        },
    };

    toolbarButtons = {

        refresh: function() {
            this.refreshMenu();
            this.refreshStatus();
        },

        refreshMenu: function() {
            let that = this;
            BrowserManager.run(function(window) {
                let document = window.document;
                let button = document.getElementById(BUTTON_ID);
                let uaMenuitems= that.createUAMenuitems(document);
                that.refreshMenuFor(button, uaMenuitems);
            });
        },
        refreshMenuFor: function(button, uaMenuitems) {
            let menupopup = button.getElementsByTagName('menupopup')[0];
            let prefMenuitem = button.getElementsByClassName('pref')[0];
            let menusep = button.getElementsByTagName('menuseparator')[0];

            menupopup.innerHTML = '';
            menupopup.appendChild(prefMenuitem);
            menupopup.appendChild(menusep);
            for (let menuitem of uaMenuitems) {
                menuitem.addEventListener('command', this.onUAMenuitemCommand);
                menupopup.appendChild(menuitem);
            }
        },

        refreshStatus: function() {
            let that = this;
            BrowserManager.run(function(window) {
                let document = window.document;
                let button = document.getElementById(BUTTON_ID);
                that.refreshStatusFor(button);
            });
        },
        refreshStatusFor: function(button) {
            let {activated, entries, currentLabel} = config;
            let uaMenuitems = button.getElementsByClassName('ua');
            let menusep = button.getElementsByTagName('menuseparator')[0];

            // hide menuseparator if no uaMenuitems
            if (entries.length === 0) {
                menusep.setAttribute('hidden', true);
            } else {
                menusep.removeAttribute('hidden');
            }

            // always deactivate button if is not check an uaMenuitem
            if (!currentLabel) {
                button.setAttribute('disabled', 'yes');
                button.setAttribute('tooltiptext', DEACTIVATED_TOOLTIPTEXT);
                return;
            }

            // update button and menuitems status
            if (activated) {
                button.removeAttribute('disabled');
                button.setAttribute('tooltiptext', ACTIVATED_TOOLTIPTEXT);
            } else {
                button.setAttribute('disabled', 'yes');
                button.setAttribute('tooltiptext', DEACTIVATED_TOOLTIPTEXT);
            }

            for (let menuitem of uaMenuitems) {
                let label = menuitem.getAttribute('label');
                menuitem.setAttribute('checked', label === currentLabel);
            }

        },

        toggle: function(activated) {
            if (activated === undefined) {
                activated = !config.activated;
            }
            config.activated = activated;
            prefObserver.saveConfig();
            uaHandler.refresh();
            this.refreshStatus();
        },

        createButtonCommand: function() {
            let that = this; // damn it
            return function(event) {

                // event fire from button
                if (event.target === this) {
                    // is button, toggle false if no uastring selected
                    let {entries, currentLabel} = config;
                    if (!currentLabel) {
                        that.toggle(false);
                    } else {
                        that.toggle();
                    }
                    return;
                }

                // event fire from uaMenuitem
                if (event.target.className === 'ua') {
                    that.toggle(true);
                    return;
                }

                // ignore prefMenuitem
            }
        },
        onPrefMenuitemCommand: function(event) {
            let dialog = Utils.getMostRecentWindow(
                                        'UserAgentOverrider:Preferences');
            if (dialog) {
                dialog.focus();
            } else {
                let window = event.target.ownerDocument.defaultView;
                window.openDialog(
                        'chrome://useragentoverrider/content/options.xul', '',
                        'chrome,titlebar,toolbar,centerscreen,dialog=no');
            }
        },
        onUAMenuitemCommand: function(event) {
            config.currentLabel = event.target.getAttribute('label');
        },

        createUAMenuitems: function(document) {
            let menuitems = [];
            for (let [label, uastring] of config.entries) {
                let attrs = {
                    'class': 'ua',
                    label: label,
                    value: uastring,
                    tooltiptext: uastring,
                    name: 'useragentoverrider-ua',
                    type: 'radio',
                };
                let menuitem = document.createElementNS(NS_XUL, 'menuitem');
                Utils.setAttrs(menuitem, attrs);
                menuitems.push(menuitem);
            }
            return menuitems;
        },

        createInstance: function(window) {
            let document = window.document;

            let button = (function() {
                let attrs = {
                    id: BUTTON_ID,
                    'class': 'toolbarbutton-1 chromeclass-toolbar-additional',
                    type: 'menu-button',
                    removable: true,
                    label: EXTENSION_NAME,
                    tooltiptext: EXTENSION_NAME,
                };
                if (config.activated) {
                    attrs.tooltiptext = ACTIVATED_TOOLTIPTEXT;
                } else {
                    attrs.disabled = 'yes';
                    attrs.tooltiptext = DEACTIVATED_TOOLTIPTEXT;
                }
                let button = document.createElementNS(NS_XUL, 'toolbarbutton');
                Utils.setAttrs(button, attrs);
                return button;
            })();
            button.addEventListener('command', this.createButtonCommand());

            let prefMenuitem = (function() {
                let menuitem = document.createElementNS(NS_XUL, 'menuitem');
                menuitem.setAttribute('class', 'pref');
                menuitem.setAttribute('label', _('openPreferences'));
                return menuitem;
            })();
            prefMenuitem.addEventListener('command',
                                          this.onPrefMenuitemCommand);

            let menusep = document.createElementNS(NS_XUL, 'menuseparator');
            let uaMenuitems= this.createUAMenuitems(document);

            let menupopup = document.createElementNS(NS_XUL, 'menupopup');
            menupopup.appendChild(prefMenuitem);
            menupopup.appendChild(menusep);
            for (let menuitem of uaMenuitems) {
                menuitem.addEventListener('command', this.onUAMenuitemCommand);
                menupopup.appendChild(menuitem);
            }

            button.appendChild(menupopup);
            this.refreshStatusFor(button);
            return button;
        }
    };

    let insertToolbarButton = function(window) {
        let button = toolbarButtons.createInstance(window);
        try {
            ToolbarManager.addWidget(window, button, config.firstRun);
        } catch(error) {
            trace(error);
        }
    };
    let removeToolbarButton = function(window) {
        try {
            ToolbarManager.removeWidget(window, BUTTON_ID);
        } catch(error) {
            trace(error);
        }
    };

    let initialize = function() {
        prefObserver.initConfig();
        prefObserver.start();
        uaHandler.refresh();

        BrowserManager.run(insertToolbarButton);
        BrowserManager.addListener(insertToolbarButton);
        StyleManager.load(STYLE_URI);
    };
    let destory = function() {
        prefObserver.saveConfig();
        prefObserver.stop();
        uaHandler.revert();

        BrowserManager.run(removeToolbarButton);
        BrowserManager.destory();
        StyleManager.destory();
    };

    let exports = {
        initialize: initialize,
        destory: destory,
    }
    return exports;

};

/* bootstrap entry points */

let userAgentOverrider;

let install = function(data, reason) {};
let uninstall = function(data, reason) {};

let startup = function(data, reason) {
    loadLocalization();
    userAgentOverrider = UserAgentOverrider();
    userAgentOverrider.initialize();
};

let shutdown = function(data, reason) {
    userAgentOverrider.destory();
};
