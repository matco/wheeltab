'use strict';

//set to true to enable debug to console
var debug_mode = false;

function debug() {
	if(debug_mode) {
		console.log.apply(console, arguments);
	}
}

//manually inject content script code after installation or update
//TODO this is only supported by Chrome
if(chrome.runtime.onInstalled) {
	chrome.runtime.onInstalled.addListener(function(details) {
		if(details.reason === 'install') {
			var script = chrome.runtime.getManifest().content_scripts[0].js[0];
			chrome.windows.getAll({populate: true}, function(windows) {
				windows.forEach(function(win) {
					win.tabs.forEach(function(tab) {
						//exclude internal chrome web pages
						if(!tab.url.startsWith('chrome')) {
							try {
								chrome.tabs.executeScript(tab.id, {file: script});
							}
							catch(exception) {
								//this may fail for some kind of tab
							}
						}
					});
				});
			});
		}
	});
}

chrome.runtime.onMessage.addListener(
	function(message) {
		debug('wheeltab bg - on message', message);
		switch(message.task) {
			case 'retrieve_tabs':
				chrome.tabs.query({currentWindow : true}, function(tabs) {
					var simple_tabs = tabs.map(function(tab) {
						return {id : tab.id, title : tab.title, url : tab.url, icon : tab.favIconUrl, active : tab.active};
					});
					debug('wheeltab bg - return tabs', simple_tabs);
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
