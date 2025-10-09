const MessageTasks = Object.freeze({
	RETRIEVE_TABS: 'retrieve_tabs',
	SELECT_TAB: 'select_tab'
});

//set to true to enable debug to console
const debug_mode = false;

function debug() {
	if(debug_mode) {
		console.log.apply(console, arguments);
	}
}

function filter_tab(tab) {
	return !tab.url.startsWith('chrome') && !tab.url.startsWith('about');
}

//manually inject content script code after installation or update
if(chrome.runtime.onInstalled) {
	chrome.runtime.onInstalled.addListener(details => {
		if(details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
			debug('inject scripts in tabs');
			const scripts = chrome.runtime.getManifest().content_scripts[0].js;
			chrome.windows.getAll({populate: true}).then(windows => {
				windows
					.flatMap(w => w.tabs)
					//exclude internal Chrome/Firefox web pages
					.filter(filter_tab)
					//inject script only in tabs that are loaded
					.filter(t => t.status === 'complete')
					.forEach(tab => {
						const parameters = {target: {tabId: tab.id}, files: scripts};
						chrome.scripting.executeScript(parameters).catch(e => console.error(`Unable to inject script in tab ${tab.id} (url: ${tab.url}): ${e}`));
					});
			});
		}
	});
}

chrome.runtime.onMessage.addListener((message, _, send) => {
	debug('receive message', message);
	switch(message.task) {
		case MessageTasks.RETRIEVE_TABS:
			chrome.tabs.query({currentWindow: true}).then(tabs => {
				const simple_tabs = tabs.filter(filter_tab).map(t => ({id: t.id, title: t.title, url: t.url, icon: t.favIconUrl, active: t.active}));
				debug('return tabs', simple_tabs);
				send(simple_tabs);
			});
			break;
		case MessageTasks.SELECT_TAB:
			chrome.tabs.update(message.id, {active: true});
			debug('select tab', message.id);
			break;
		default:
			debug('unknown task', message.task);
	}
	return true;
});
