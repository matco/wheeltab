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
		debug('wheeltab bg - on installed', details);
		if(details.reason === 'install') {
			const script = chrome.runtime.getManifest().content_scripts[0].js[0];
			chrome.windows.getAll({populate: true}, windows => {
				windows
					.flatMap(w => w.tabs)
					//exclude internal chrome/firefox web pages
					.filter(t => !t.url.startsWith('chrome') && !t.url.startsWith('about'))
					.forEach(tab => {
						try {
							chrome.scripting.executeScript({
								target: {tabId: tab.id},
								files: [script]
							});
						}
						catch(exception) {
							console.error(exception);
							//this may fail for some kind of tab
						}
					});
			});
		}
	});
}

chrome.runtime.onMessage.addListener(
	(message, _, send) => {
		debug('wheeltab bg - on message', message);
		switch(message.task) {
			case 'retrieve_tabs':
				chrome.tabs.query({currentWindow: true}, tabs => {
					const simple_tabs = tabs.map(t => ({id: t.id, title: t.title, url: t.url, icon: t.favIconUrl, active: t.active}));
					debug('wheeltab bg - return tabs', simple_tabs);
					send(simple_tabs);
				});
				break;
			case 'select_tab':
				chrome.tabs.update(message.id, {active: true});
				break;
			default:
				debug('wheeltab vg - unknown event', message.task);
		}
		return true;
	}
);
