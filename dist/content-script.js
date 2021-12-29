//set to true to enable debug to console
const debug_mode = false;

function debug() {
	if(debug_mode) {
		console.log.apply(console, arguments);
	}
}

let menu; //current menu
let selected_item; //index of selected item in menu

let mouse_moved = false;

function draw_item(tab, index) {
	const item = document.createElement('li');
	item.dataset.id = tab.id;
	item.style.fontFamily = 'Arial';
	item.style.fontSize = '16px';
	item.style.overflow = 'hidden';
	item.style.whiteSpace = 'nowrap';
	item.style.textOverflow = 'ellipsis';
	item.style.padding = '5px';
	item.style.margin = '0';
	item.style.lineHeight = '100%';
	if(index !== 0) {
		item.style.borderTop = '1px solid #333';
	}
	if(tab.active) {
		selected_item = index;
		item.style.backgroundColor = '#333';
		item.style.color = 'white';
	}
	else {
		item.style.backgroundColor = 'white';
		item.style.color = '#333';
	}
	//icon
	if(tab.icon) {
		const icon = document.createElement('img');
		icon.setAttribute('src', tab.icon);
		icon.setAttribute('alt', 'Tab favicon');
		icon.style.width = '16px';
		icon.style.height = '16px';
		icon.style.marginRight = '5px';
		icon.style.verticalAlign = 'text-bottom';
		icon.style.display = 'inline';
		item.appendChild(icon);
	}
	else {
		item.style.paddingLeft = '25px';
	}
	//text
	item.appendChild(document.createTextNode(tab.title || tab.url));
	return item;
}

function select_item(index) {
	debug(`wheeltab - select item ${index}`);
	Array.prototype.forEach.call(menu.children, (item, i) => {
		if(i === index) {
			item.style.backgroundColor = '#333';
			item.style.color = 'white';
			item.scrollIntoView();
		}
		else {
			item.style.backgroundColor = 'white';
			item.style.color = '#333';
		}
	});
}

function manage_wheel(event) {
	debug('wheeltab - wheel event');
	if(!mouse_moved && menu.style.display !== 'block') {
		menu.style.display = 'block';
	}
	if(menu.style.display === 'block') {
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
}

function load_menu(event) {
	if(event.button === 0) {
		mouse_moved = false;
		//create menu
		debug('wheeltab - load menu');
		menu = document.createElement('ul');
		menu.style.display = 'none';
		menu.style.zIndex = '99999999999999';
		//position
		menu.style.position = 'fixed';
		menu.style.left = '50%';
		menu.style.transform = 'translate(-50%)';
		menu.style.top = '10%';
		//size
		menu.style.width = '500px';
		menu.style.maxWidth = '80%';
		menu.style.maxHeight = '80%';
		menu.style.overflowY = 'auto';
		//border
		menu.style.border = '2px solid black';
		menu.style.borderRadius = '5px';
		//miscellaneous
		menu.style.listStyle = 'none';
		menu.style.margin = '0';
		menu.style.padding = '0';
		menu.style.boxShadow = '0 0 30px 0 black';
		document.body.appendChild(menu);
		//reset selected item
		selected_item = undefined;
		//ask for tabs
		chrome.runtime.sendMessage({task: 'retrieve_tabs'}, tabs => tabs.map(draw_item).forEach(Node.prototype.appendChild, menu));
		//add listeners
		document.addEventListener('mouseup', close_menu, {once: true});
		document.addEventListener('wheel', manage_wheel, {passive: false});
	}
}

function close_menu() {
	debug('wheeltab - close menu');
	//remove listeners
	document.removeEventListener('wheel', manage_wheel);
	//ask to select tab
	debug(`wheeltab - go to tab ${selected_item}`);
	if(selected_item !== undefined) {
		const tab_id = parseInt(menu.children[selected_item].dataset.id);
		chrome.runtime.sendMessage({task: 'select_tab', id: tab_id});
	}
	//destroy menu
	document.body.removeChild(menu);
}

document.addEventListener('mousedown', load_menu);

document.addEventListener('mousemove', () => mouse_moved = true);
