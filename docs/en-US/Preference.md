Preference
==========

We reference "User Agent Overrider" as "UAO".

## Format

You can custom the toolbar button menu item in preference panel.

One line one menu item and user-agent string pair. format as below:


    # line starts with `#` is comment
    menu_item_label: user_agent_string_for_this_menu_item_label
    #              ^
    #              the first colon `:` character as separator


Empty line, comment and other invalid format line will be ignored.

If you remove or rename the checked menuitem's label, the extension will deactivate automatically.

## Example

Here is the [built-in user-agents file](https://github.com/muzuiget/user_agent_overrider/blob/master/src/_includes/assets/builtin_user_agents.txt)

Here is legacy Microsoft IE list which does not ship in latest version

    # IE
    Windows / IE 6: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)
    Windows / IE 7: Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)
    Windows / IE 8: Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0)
    Windows / IE 9: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)
    Windows / IE 10: Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)

## Check your user-agent

### Method 1

Open `about:config`, find `general.useragent.override` item.

This what and the only thing UAO actually modifty Firefox configure.

The value should be **the same as** your choice in UAO, if not, there is a bug.

### Method 2

Open Firefox DevTools, switch to "Network" tab, visit any url, select a request item on left panel, you will see a "User-Agent" below "Requeset headers" section.

This user-agent Firefox finally send out, **maybe not the same** your choice in UAO, because other Firefox extension may change it again, is not the UAO bug.

### Method 3

Visit url http://httpbin.org/user-agent

This page will echo what user-agent reach the server, also **maybe not the same** your choice in UAO, because firewall or proxy in your network will change it again, is not the UAO bug.

## Useful sites to get user agent:

* http://www.useragentstring.com/
* http://www.user-agents.org/
