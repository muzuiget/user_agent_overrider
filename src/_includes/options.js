/* eslint-env browser */
/* global Utils */
/* global ASSET_BUILTIN_UA_TEXT */

var _ = null;
var loadLocalization = function() {
    let stringbundle = document.getElementById('useragentoverrider-strings');
    _ = (name) => stringbundle.getString(name);
};

var onHelpLinkClick = function() {
    let helpUrl = 'https://github.com/muzuiget/user_agent_overrider/blob/master/docs/en-US/Preference.md';
    let browserWindow = Utils.getMostRecentWindow('navigator:browser');
    if (browserWindow) {
        let gBrowser = browserWindow.gBrowser;
        gBrowser.selectedTab = gBrowser.addTab(helpUrl);
    } else {
        window.open(helpUrl);
    }
    return false;
};

var onResetLinkClick = function() {
    let response = confirm(_('areYouSure'));
    if (!response) {
        return;
    }
    let textbox = document.getElementById('textbox');
    textbox.value = ASSET_BUILTIN_UA_TEXT.trim() + '\n';
    document.getElementById('main').userChangedValue(textbox);
};

var onDocumentLoad = function() {
    loadLocalization();
};

/* exported onHelpLinkClick */
/* exported onResetLinkClick */
/* exported onDocumentLoad */
