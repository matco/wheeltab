'use strict';

//set to true to enable debug to console
var debug_mode = false;

function debug() {
	if(debug_mode) {
		console.log.apply(console, arguments);
	}
}

var menu; //current menu
var selected_item; //index of selected item in menu

var prevent_context_menu;

function draw_item(tab, index) {
	var item = document.createElement('li');
	item.dataset.id = tab.id;
	//icon
	if(tab.icon && !tab.icon.startsWith('chrome')) {
		var icon = document.createElement('img');
		icon.setAttribute('src', tab.icon);
		icon.setAttribute('alt', 'Tab icon');
		icon.style.width = '16px';
		icon.style.height = '16px';
		icon.style.marginRight = '5px';
		icon.style.verticalAlign = 'bottom';
		item.appendChild(icon);
	}
	//text
	item.appendChild(document.createTextNode(tab.title || tab.url));
	//style
	item.style.fontFamily = 'Arial';
	item.style.fontSize = '14px';
	item.style.padding = '2px';
	item.style.margin = '0';
	if(tab.active) {
		selected_item = index;
		item.style.backgroundColor = '#333';
		item.style.color = 'white';
	}
	if(index !== 0) {
		item.style.borderTop = '1px solid #999';
	}
	return item;
}

function select_item(index) {
	debug('wheeltab - select item ' + index);
	Array.prototype.forEach.call(menu.children, function(item, i) {
		if(i === index) {
			item.style.backgroundColor = '#333';
			item.style.color = 'white';
		}
		else {
			item.style.backgroundColor = '';
			item.style.color = '';
		}
	});
}

function manage_wheel(event) {
	debug('wheeltab - wheel event');
	if(menu.style.display !== 'block') {
		prevent_context_menu = true;
		//position menu
		menu.style.left = event.clientX + 'px';
		menu.style.top = event.clientY + 'px';
		menu.style.display = 'block';
	}
	if(event.deltaY < 0) {
		if(selected_item === undefined || selected_item === 0) {
			selected_item = menu.children.length - 1;
		}
		else {
			selected_item--;
		}
		select_item(selected_item);
	}
	else {
		if(selected_item === undefined || selected_item === menu.children.length - 1) {
			selected_item = 0;
		}
		else {
			selected_item++;
		}
		select_item(selected_item);
	}
	event.stopPropagation();
	event.preventDefault();
}

function load_menu(event) {
	if(event.button == 2) {
		//create menu
		debug('wheeltab - load menu');
		menu = document.createElement('ul');
		menu.style.position = 'fixed';
		menu.style.listStyle = 'none';
		menu.style.textAlign = 'center';
		menu.style.backgroundColor = 'white';
		menu.style.margin = '0';
		menu.style.padding = '0';
		menu.style.border = '2px solid #999';
		menu.style.borderRadius = '2px';
		menu.style.display = 'none';
		menu.style.zIndex = '99999999999999';
		document.body.appendChild(menu);
		//reset selected item
		selected_item = undefined;
		//ask for tabs
		chrome.runtime.sendMessage({task : 'retrieve_tabs'});
		//add listeners
		window.addEventListener('mouseup', close_menu);
		window.addEventListener('wheel', manage_wheel);
	}
}

function close_menu(event) {
	debug('wheeltab - close menu');
	//remove listeners
	window.removeEventListener('wheel', manage_wheel);
	window.removeEventListener('mouseup', close_menu);
	//ask to select tab
	debug('wheeltab - go to tab ' + selected_item);
	if(selected_item) {
		var tab_id = parseInt(menu.children[selected_item].dataset.id);
		chrome.runtime.sendMessage({task : 'select_tab', id : tab_id});
	}
	//destroy menu
	document.body.removeChild(menu);
}

chrome.runtime.onMessage.addListener(
	function(message) {
		debug('wheeltab - on message', message);
		switch(message.event) {
			case 'tabs':
				Array.prototype.map.call(message.tabs, draw_item).forEach(Node.prototype.appendChild, menu);
				break;
		}
	}
);

document.addEventListener('mousedown', load_menu);

document.addEventListener(
	'contextmenu',
	function(event) {
		if(prevent_context_menu) {
			prevent_context_menu = false;
			event.preventDefault();
		}
	}
);
