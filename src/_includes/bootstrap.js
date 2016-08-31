/* global trace */
/* global NS_XUL */
/* global Utils */
/* global ToolbarManager */
/* global BrowserManager */
/* global StyleManager */
/* global UAManager */
/* global Pref */
/* global ASSET_BUILTIN_UA_TEXT */

var _ = null;
var loadLocalization = function() {
    _ = Utils.localization('useragentoverrider', 'global');
};

var uaEntriesConverter = function(text) {
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

var UserAgentOverrider = function() {

    const EXTENSION_NAME = 'User Agent Overrider';
    const BUTTON_ID = 'useragentoverrider-button';
    const STYLE_URI = 'chrome://useragentoverrider/skin/browser.css';
    const PREF_BRANCH = 'extensions.useragentoverrider.';

    const ACTIVATED_TOOLTIPTEXT = EXTENSION_NAME + '\n' +
                                  _('activatedTooltip');
    const DEACTIVATED_TOOLTIPTEXT = EXTENSION_NAME + '\n' +
                                    _('deactivatedTooltip');

    const DEFAULT_ENTRIES_STRING = ASSET_BUILTIN_UA_TEXT.trim() + '\n';

    let config = {
        firstRun: true,
        activated: false,
        entries: [],
        currentLabel: '', // label in entries
    };
    let pref = Pref(PREF_BRANCH);

    let prefObserver;
    let uaHandler;
    let toolbarButtons;

    prefObserver = {

        observe: function() {
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
        },
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
                let uaMenuitems = that.createUAMenuitems(document);
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
                menuitem.addEventListener('command', this.onUAMenuitemCommand.bind(this));
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
                button.setAttribute('default-selected', 'yes');
                button.setAttribute('tooltiptext', DEACTIVATED_TOOLTIPTEXT);
                uaMenuitems[0].setAttribute('checked', true);
                return;
            }

            // update button and menuitems status
            if (activated) {
                button.removeAttribute('default-selected');
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
            let value = event.target.getAttribute('value');

            // zero is the default menuitem
            if (value === '0') {
                config.currentLabel = '';
                this.toggle(false);
                return;
            }

            config.currentLabel = event.target.getAttribute('label');
            this.toggle(true);
        },

        createUAMenuitems: function(document) {
            let defaultEntry = [_('default'), UAManager.defaultUa];

            let entries = [];
            entries.push(defaultEntry);
            entries.push.apply(entries, config.entries);

            let menuitems = [];
            for (let i = 0; i < entries.length; i += 1) {
                let [label, uastring] = entries[i];
                let attrs = {
                    'class': 'ua',
                    label: label,
                    value: i,
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
                    type: 'menu',
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

            let prefMenuitem = (function() {
                let menuitem = document.createElementNS(NS_XUL, 'menuitem');
                menuitem.setAttribute('class', 'pref');
                menuitem.setAttribute('label', _('openPreferences'));
                return menuitem;
            })();
            prefMenuitem.addEventListener('command',
                                          this.onPrefMenuitemCommand);

            let menusep = document.createElementNS(NS_XUL, 'menuseparator');
            let uaMenuitems = this.createUAMenuitems(document);

            let menupopup = document.createElementNS(NS_XUL, 'menupopup');
            menupopup.appendChild(prefMenuitem);
            menupopup.appendChild(menusep);
            for (let menuitem of uaMenuitems) {
                menuitem.addEventListener('command', this.onUAMenuitemCommand.bind(this));
                menupopup.appendChild(menuitem);
            }

            button.appendChild(menupopup);
            this.refreshStatusFor(button);
            return button;
        },
    };

    let insertToolbarButton = function(window) {
        let button = toolbarButtons.createInstance(window);
        try {
            ToolbarManager.addWidget(window, button, config.firstRun);
        } catch (error) {
            trace(error);
        }
    };
    let removeToolbarButton = function(window) {
        try {
            ToolbarManager.removeWidget(window, BUTTON_ID);
        } catch (error) {
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
    };
    return exports;

};

/* bootstrap entry points */

var userAgentOverrider;

var install = function() {};
var uninstall = function() {};

var startup = function() {
    loadLocalization();
    userAgentOverrider = UserAgentOverrider();
    userAgentOverrider.initialize();
};

var shutdown = function() {
    userAgentOverrider.destory();
};

/* exported install uninstall startup shutdown */
