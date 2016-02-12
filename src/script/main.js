/* global trace */
/* global NS_XUL */
/* global Utils */
/* global ToolbarManager */
/* global BrowserManager */
/* global StyleManager */
/* global UAManager */
/* global Pref */

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

    const DEFAULT_ENTRIES_STRING = [
        '# Linux',
        'Linux / Firefox 29: Mozilla/5.0 (X11; Linux x86_64; rv:29.0) Gecko/20100101 Firefox/29.0',
        'Linux / Chrome 34: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/537.36',
        '',
        '# Mac',
        'Mac / Firefox 29: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:29.0) Gecko/20100101 Firefox/29.0',
        'Mac / Chrome 34: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/537.36',
        'Mac / Safari 7: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/537.75.14',
        '',
        '# Windows',
        'Windows / Firefox 29: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:29.0) Gecko/20100101 Firefox/29.0',
        'Windows / Chrome 34: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/537.36',
        'Windows / IE 6: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)',
        'Windows / IE 7: Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
        'Windows / IE 8: Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0)',
        'Windows / IE 9: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        'Windows / IE 10: Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
        'Windows / IE 11: Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        '',
        '# Android',
        'Android / Firefox 29: Mozilla/5.0 (Android; Mobile; rv:29.0) Gecko/29.0 Firefox/29.0',
        'Android / Chrome 34: Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.114 Mobile Safari/537.36',
        '',
        '# iOS',
        'iOS / Chrome 34: Mozilla/5.0 (iPad; CPU OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/34.0.1847.18 Mobile/11B554a Safari/9537.53',
        'iOS / Safari 7: Mozilla/5.0 (iPad; CPU OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B554a Safari/9537.53',
        '',
        '',
    ].join('\n');

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
            };
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
            let uaMenuitems = this.createUAMenuitems(document);

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

var install = function(data, reason) {};
var uninstall = function(data, reason) {};

var startup = function(data, reason) {
    loadLocalization();
    userAgentOverrider = UserAgentOverrider();
    userAgentOverrider.initialize();
};

var shutdown = function(data, reason) {
    userAgentOverrider.destory();
};
