# Wheeltab
Wheeltab is a browser extension that allows you to navigate through your open tabs using your mouse wheel.

## Usage
Press and hold the left button of your mouse, without moving your mouse. Then, use your mouse wheel to scroll through the list of open tabs in the menu that will appear. Release the left button to jump to the highlighted tab. Use the "Escape" key to close the menu and stay on the current tab.

## Compatibility
This extension is theoretically compatible with browsers that support web extensions v3 (also known as Manifest v3). However, it's difficult to have a single code base for every browsers because of discrepancies between the different browser implementations. For example, the description of the background service in the manifest file can not written in a way that works for Chrome and Firefox. Despite what is written is the [MDN documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background#browser_support), adding the "scripts" flag in the "background" section makes Chrome reject the extension.

For that reason, the extension is currently only compatible with Chrome. It is available on the Chrome web store [here](https://chrome.google.com/webstore/detail/wheeltab/acipnfeildejkaebclgfajogkmilgldh).

## Permissions
Here are the justification of the permission as presented in the Chrome web store developer dashboard.

### Tabs justification
The extension needs to access all the tabs to inject the script that will detect the combination of mouse events that trigger the display of the tab selection menu. For now, it's not possible to use the [activeTab](https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/) permission because this permission can be used only after a "user gesture" (see the section "Invoking activeTab") and it's not possible to register the combination of mouse events as a gesture.

### Scripting justification
The extension injects a script that does the following:
* detect a combination of mouse events in the active tab
* display the tab selection menu over the website

### Host permission justification
The extension requires the `<all_urls>` permissions because it needs to inject a script (used to display the menu listing all the tabs) on every tab, whatever the website.

## Limitations
The extension will not be work on the following websites or tabs:
* websites that intercept the left click of the mouse
* browser internal pages (those starting with `chrome://` or `about:`)
