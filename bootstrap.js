/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const BROWSER_URI = 'chrome://browser/content/browser.xul';
const STYLE_URI = 'chrome://useragentoverrider/skin/browser.css';
const PREFERENCE_BRANCH = 'extensions.useragentoverrider.';
const DEFAULT_ENTRIES = [
    ['Firefox 20/Linux', 'Mozilla/5.0 (X11; Linux x86_64; rv:20.0) Gecko/20100101 Firefox/20.0'],
    ['Firefox 20/Windows', 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'],
    ['Chrome 26/Linux', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.43 Safari/537.31'],
    ['Chrome 26/Windows', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.43 Safari/537.31'],
];

const log = function() { dump(Array.slice(arguments).join(' ') + '\n'); }

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const SSS = Cc['@mozilla.org/content/style-sheet-service;1']
              .getService(Ci.nsIStyleSheetService);
const IOS = Cc['@mozilla.org/network/io-service;1']
              .getService(Ci.nsIIOService);
const PFS = Cc['@mozilla.org/preferences-service;1']
              .getService(Ci.nsIPrefService).getBranch(PREFERENCE_BRANCH);
const WW = Cc['@mozilla.org/embedcomp/window-watcher;1']
             .getService(Ci.nsIWindowWatcher);
const nsISupportsString = function(data) {
    let string = Cc['@mozilla.org/supports-string;1']
                   .createInstance(Ci.nsISupportsString);
    string.data = data;
    return string;
};

// keep all current status
let Settings = {
    enabled: false, // mean take effect, sync with toolbar button status
    userAgent: '' // override to this user agent string
};

let UserAgentOverrider = {

    /*
     * Firefox builtin UA handle object.
     */
    UserAgentOverrides: null,

    /*
     * Orignal UA selector function, a method of UserAgentOverrides.
     * Keep it for later revert.
     */
    orignalGetOverrideForURI: null,

    initiate: function() {
        let module = {};
        Cu.import('resource://gre/modules/UserAgentOverrides.jsm', module);
        let UserAgentOverrides = module.UserAgentOverrides;
        this.UserAgentOverrides = UserAgentOverrides;
        this.orignalGetOverrideForURI = UserAgentOverrides.getOverrideForURI;
    },

    enable: function(value) {
        if (value && Settings.userAgent) {
            this.UserAgentOverrides.getOverrideForURI =
                                                function() Settings.userAgent;
        } else {
            this.UserAgentOverrides.getOverrideForURI =
                                                this.orignalGetOverrideForURI;
        }
        Settings.enabled = value;
    },
    change: function(userAgent) {
        Settings.userAgent = userAgent;
    },

    onclick: function(event, button) {
        // The toolbar button is a menu-button.
        // if click menu part, always set status to enable.
        if (event.target !== button) {
            button.removeAttribute('disabled');
            this.enable(true);
            return;
        }

        // If click the button part, toggle status,
        let value = button.getAttribute('disabled');
        if (value === 'yes') {
            button.removeAttribute('disabled');
            this.enable(true);
        } else {
            button.setAttribute('disabled', 'yes');
            this.enable(false);
        }
    }
};

let ToolbarButton = {

    /**
     * Store button and corresponding window object, use for update menu after
     * change preference.
     * format: [[button1, window1], [button2, window2]]
     */
    buttons: [],

    /**
     * Remove the closed window reference.
     */
    cleanupButtons: function() {
        this.buttons = this.buttons.filter(function(value) {
            let window = value[1];
            return !window.closed;
        });
    },

    /**
     * Update menu after change preference,
     * a callback for preferenceChangedListener.
     */
    refreshMenus: function() {
        this.cleanupButtons();
        let buttons = this.buttons;
        for (let [button, window] of this.buttons) {
            let menupopup = this.createMenupopup(window.document);
            button.replaceChild(menupopup, button.firstChild);
        }
    },

    /**
     * Get user custom user agent entries from preferences manager.
     */
    getCustomEntries: function() {
        let key = 'entries';
        let data;
        try {
            data = PFS.getComplexValue(key, Ci.nsISupportsString).data;
        } catch(error) {
            let lines = DEFAULT_ENTRIES.map(function(v) v.join(': '));
            data = lines.join('\n');
            PFS.setComplexValue(key, Ci.nsISupportsString,
                                nsISupportsString(data));
            return DEFAULT_ENTRIES;
        }

        let entries = [];
        let lines = data.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//')) {
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
    },

    isFirstRun: function() {
        let key = 'firstRun';
        let value;
        try {
            value = PFS.getBoolPref(key);
        } catch(error) {
            PFS.setBoolPref(key, false);
            value = true;
        }
        return value;
    },

    createMenuitem: function(document, label, value, checked) {
        let menuitem = document.createElementNS(NS_XUL, 'menuitem');
        menuitem.setAttribute('label', label);
        menuitem.setAttribute('checked', checked);
        menuitem.setAttribute('name', 'useragentoverrider-value');
        menuitem.setAttribute('type', 'radio');
        menuitem.setAttribute('tooltiptext', value);
        menuitem.addEventListener('command', function(event) {
            UserAgentOverrider.change(value);
        });
        return menuitem;
    },

    createMenupopup: function(document) {
        let menupopup = document.createElementNS(NS_XUL, 'menupopup');
        let entries = this.getCustomEntries();
        let selectedValueKeeped = false;

        for (let [label, value] of entries) {
            let checked = value == Settings.userAgent;
            if (checked) {
                selectedValueKeeped = true;
            }
            let menuitem = this.createMenuitem(document, label, value, checked);
            menupopup.appendChild(menuitem);
        }

        if (!selectedValueKeeped) {
            Settings.userAgent = '';
        }

        return menupopup;
    },

    createButton: function(document) {
        let button = document.createElementNS(NS_XUL, 'toolbarbutton');
        button.setAttribute('id', 'useragentoverrider-button');
        button.setAttribute('class',
                            'toolbarbutton-1 chromeclass-toolbar-additional');
        button.setAttribute('type', 'menu-button');
        button.setAttribute('removable', 'true');
        button.setAttribute('label', 'User Agent Overrider');
        button.setAttribute('tooltiptext', 'User Agent Overrider');
        if (!Settings.enabled) {
            button.setAttribute('disabled', 'yes');
        }
        button.addEventListener('command', function(event) {
            UserAgentOverrider.onclick(event, button);;
        });
        return button;
    },

    /**
     * Remember the button position.
     * This function Modity from addon-sdk file lib/sdk/widget.js, and
     * function BrowserWindow.prototype._insertNodeInToolbar
     */
    layoutButton: function(document, button) {

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
            if (this.isFirstRun()) {
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
    },

    insertButton: function(window) {
        if (window.location.href !== BROWSER_URI) {
            return;
        }

        let document = window.document;
        try {
            let button = this.createButton(document);
            this.layoutButton(document, button);
            this.buttons.push([button, window]);

            // add menu
            let menupopup = this.createMenupopup(document);
            button.appendChild(menupopup);
        } catch(error) {
            log(error);
        }
    },

    removeButton: function(window) {
        if (window.location.href !== BROWSER_URI) {
            return;
        }

        let document = window.document;
        try {
            let button = document.getElementById('useragentoverrider-button');
            button.parentNode.removeChild(button);
        } catch(error) {
            log(error);
        }
    }
};

let windowOpenedListener = {
    observe: function(window, topic) {
        if (topic !== 'domwindowopened') {
            return;
        }
        window.addEventListener('load', function(event) {
            ToolbarButton.insertButton(window);
        }, false);
    }
};

let preferenceChangedListener = {
    observe: function(subject, topic, data) {
        if (data !== 'entries') {
            return;
        }
        ToolbarButton.refreshMenus();
    }
};

/* bootstrap entry points */

let install = function(data, reason) {};
let uninstall = function(data, reason) {};

let startup = function(data, reason) {
    // add custom css
    let styleUri = IOS.newURI(STYLE_URI, null, null);
    if (!SSS.sheetRegistered(styleUri, SSS.USER_SHEET)) {
        SSS.loadAndRegisterSheet(styleUri, SSS.USER_SHEET);
    }

    // add toolbar to exists window
    let windows = WW.getWindowEnumerator();
    while (windows.hasMoreElements()) {
        ToolbarButton.insertButton(windows.getNext());
    }

    // add toolbar to new open window
    WW.registerNotification(windowOpenedListener);

    // refresh menus after preference change
    PFS.addObserver('', preferenceChangedListener, false);

    // initiate
    UserAgentOverrider.initiate();
};

let shutdown = function(data, reason) {
    // remove custom css
    let styleUri = IOS.newURI(STYLE_URI, null, null);
    if (SSS.sheetRegistered(styleUri, SSS.USER_SHEET)) {
        SSS.unregisterSheet(styleUri, SSS.USER_SHEET);
    }

    // remove toolbar from exists windows
    let windows = WW.getWindowEnumerator();
    while (windows.hasMoreElements()) {
        ToolbarButton.removeButton(windows.getNext());
    }

    // stop add toolbar to new open window
    WW.unregisterNotification(windowOpenedListener);

    // stop update menu after preference change
    PFS.removeObserver('', preferenceChangedListener, false);

    // disable, cleanup
    UserAgentOverrider.enable(false);
};
