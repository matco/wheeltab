'use strict';

//manually inject content script code after installation or update
chrome.runtime.onInstalled.addListener(function(details) {
	if(details.reason === 'install') {
		var script = chrome.runtime.getManifest().content_scripts[0].js[0];
		chrome.windows.getAll({populate: true}, function(windows) {
			windows.forEach(function(win) {
				win.tabs.forEach(function(tab) {
					try {
						chrome.tabs.executeScript(tab.id, {file: script});
					}
					catch(exception) {
						//this will not work for chrome internal web page
					}
				});
			});
		});
	}
});

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
