'use strict';

//set to true to enable debug to console
var debug_mode = false;
var keep = false;

function debug() {
	if(debug_mode) {
		console.log.apply(console, arguments);
	}
}

var menuOn = false;
var menu; //current menu
var selected_item; //index of selected item in menu

var prevent_context_menu;

function filter_tab(tab) {
	return !tab.url.startsWith('chrome');
}

function draw_item(tab, index) {
	var item = document.createElement('li');
	item.dataset.id = tab.id;
	//icon
	if(tab.icon) {
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
	item.style.whiteSpace = 'nowrap';
	item.style.padding = '4px';
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
	if((event.buttons === 4 || event.buttons === 2) && !menuOn){
			
			// In case the user creates a new menu 
			// without closing the last one
			destroyMenu();
			
			menuOn = true;
			debug('wheeltab - load menu');
			menu = document.createElement('ul');
			menu.id = "teste";
			menu.style.minWidth = '250px';
			menu.style.maxWidth = '500px';
			menu.style.position = 'fixed';
			menu.style.listStyle = 'none';
			menu.style.textAlign = 'left';
			menu.style.backgroundColor = 'white';
			menu.style.overflow = "hidden";
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
			document.addEventListener('mouseup', close_menu);
			
			// keep menu opened if using wheel button
			if(event.buttons === 4) keep = true;
	}
	if(menu){
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
	else{
		// Restore scrolling with wheel
		return true;
	}
	
}

function destroyMenu(){
	if(menu){
		document.body.removeChild(menu);
		menu = undefined;
	}
}

function close_menu(event) {
	if(menu){
		if(!keep){
			debug('wheeltab - close menu');
			//ask to select tab
			debug('wheeltab - go to tab ' + selected_item);
			if(selected_item !== undefined) {
				var tab_id = parseInt(menu.children[selected_item].dataset.id);
				chrome.runtime.sendMessage({task : 'select_tab', id : tab_id});
			}
			//destroy menu
			destroyMenu();
		}
	}
}

chrome.runtime.onMessage.addListener(
	function(message) {
		debug('wheeltab - on message', message);
		switch(message.event) {
			case 'tabs':
				var tabs = Array.prototype.slice.call(message.tabs);
				//exclude internal chrome web pages and draw other tabs in menu
				tabs
					.filter(filter_tab)
					.map(draw_item)
					.forEach(Node.prototype.appendChild, menu);
				break;
		}
	}
);


document.addEventListener('mousedown', function(event){
	menuOn = false;
	keep = false;
	if(event.button == 0 || event.button == 2) {
		destroyMenu();		
	}
});

document.addEventListener('wheel', manage_wheel);	

document.addEventListener(
	'contextmenu',
	function(event) {
		if(prevent_context_menu) {
			prevent_context_menu = false;
			event.preventDefault();
		}
	}
);
