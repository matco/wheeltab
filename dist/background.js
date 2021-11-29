//set to true to enable debug to console
const debug_mode = false;

function debug() {
	if(debug_mode) {
		console.log.apply(console, arguments);
	}
}

//manually inject content script code after installation or update
if(chrome.runtime.onInstalled) {
	chrome.runtime.onInstalled.addListener(details => {
		if(details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
			debug('inject script in tabs');
			const script = chrome.runtime.getManifest().content_scripts[0].js[0];
			chrome.windows.getAll({populate: true}, windows => {
				windows
					.flatMap(w => w.tabs)
					//exclude internal chrome/firefox web pages
					.filter(t => !t.url.startsWith('chrome') && !t.url.startsWith('about'))
					//inject script only in tabs that are loaded
					.filter(t => t.status === 'complete')
					.forEach(tab => {
						const parameters = {target: {tabId: tab.id}, files: [script]};
						chrome.scripting.executeScript(parameters).catch(e => console.error(`Unable to inject script in tab ${tab.id} (url: ${tab.url}): ${e}`));
					});
			});
		}
	});
}

chrome.runtime.onMessage.addListener(
	(message, _, send) => {
		debug('receive message', message);
		switch(message.task) {
			case 'retrieve_tabs':
				chrome.tabs.query({currentWindow: true}, tabs => {
					const simple_tabs = tabs.map(t => ({id: t.id, title: t.title, url: t.url, icon: t.favIconUrl, active: t.active}));
					debug('return tabs', simple_tabs);
					send(simple_tabs);
				});
				break;
			case 'select_tab':
				chrome.tabs.update(message.id, {active: true});
				debug('select tab', message.id);
				break;
			default:
				debug('unknown task', message.task);
		}
		return true;
	}
);
