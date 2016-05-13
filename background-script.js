'use strict';

chrome.runtime.onMessage.addListener(
	function(message) {
		console.log('wheeltab bg - on message', message);
		switch(message.task) {
			case 'retrieve_tabs':
				chrome.tabs.query({}, function(tabs) {
					var simple_tabs = tabs.map(function(tab) {
						return {id : tab.id, title : tab.title, url : tab.url, icon : tab.favIconUrl, active : tab.active};
					});
					console.log('wheeltab bg - return tabs', simple_tabs);
					send({event : 'tabs', tabs : simple_tabs});
				});
			case 'select_tab':
				chrome.tabs.update(message.id, {active : true});
		}
	}
);

function send(message) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message);
	});
}
