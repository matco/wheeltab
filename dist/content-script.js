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

let dialog; //current dialog
let menu; //current menu
let selected_item; //index of selected item in menu

let keydown_abort;
let wheel_abort;
let mouseup_abort;
let mousemove_abort;

function draw_item(tab, index) {
	const item = document.createElement('li');
	item.dataset.id = tab.id;
	item.style.fontFamily = 'Arial';
	item.style.fontSize = '16px';
	item.style.fontWeight = 'normal';
	item.style.overflow = 'hidden';
	item.style.whiteSpace = 'nowrap';
	item.style.textOverflow = 'ellipsis';
	item.style.textAlign = 'left';
	item.style.padding = '5px';
	item.style.margin = '0';
	item.style.lineHeight = 'auto';
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
	if(!dialog.open) {
		dialog.showModal();
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

function close_menu() {
	debug('wheeltab - close menu');
	//remove or abort listeners
	keydown_abort.abort();
	mouseup_abort.abort();
	wheel_abort.abort();
	mousemove_abort.abort();
	//destroy menu
	dialog.close();
	document.body.removeChild(dialog);
}

function open_selected_item() {
	//ask to select tab
	debug(`wheeltab - go to tab ${selected_item}`);
	if(selected_item !== undefined) {
		const tab_id = parseInt(menu.children[selected_item].dataset.id);
		chrome.runtime.sendMessage({task: MessageTasks.SELECT_TAB, id: tab_id});
	}
	close_menu();
}

function escape_menu(event) {
	if(event.key === 'Escape') {
		close_menu();
	}
}

function prevent_menu() {
	wheel_abort.abort();
}

function load_menu(event) {
	if(event.button === 0) {
		//create menu
		debug('wheeltab - load menu');
		wheel_abort = new AbortController();
		mouseup_abort = new AbortController();
		keydown_abort = new AbortController();
		mousemove_abort = new AbortController();

		dialog = document.createElement('dialog');
		//size
		dialog.style.width = '50vw';
		dialog.style.left = '25vw';
		dialog.style.maxHeight = '50vh';
		dialog.style.top = '20vh';
		dialog.style.overflowY = 'auto';
		//border
		dialog.style.border = '2px solid black';
		dialog.style.borderRadius = '5px';
		//miscellaneous
		dialog.style.margin = '0';
		dialog.style.padding = '0';
		dialog.style.boxShadow = '0 0 30px 0 black';
		dialog.style.userSelect = 'none';

		const nav = document.createElement('nav');
		dialog.appendChild(nav);

		//put the content of the dialog in a shadow DOM
		//it's only possible to start at the nav element level because the dialog tag does not support shadow DOM
		const shadow = nav.attachShadow({mode: 'closed'});

		menu = document.createElement('ol');
		menu.style.display = 'block';
		menu.style.margin = '0';
		menu.style.padding = '0';
		menu.style.listStyle = 'none';
		shadow.appendChild(menu);

		document.body.appendChild(dialog);
		//reset selected item
		selected_item = undefined;
		//ask for tabs
		chrome.runtime.sendMessage({task: MessageTasks.RETRIEVE_TABS}).then(tabs => tabs.map(draw_item).forEach(Node.prototype.appendChild, menu));
		//add listeners
		document.addEventListener('keydown', escape_menu, {once: true, signal: keydown_abort.signal});
		document.addEventListener('mouseup', open_selected_item, {once: true, signal: mouseup_abort.signal});
		document.addEventListener('wheel', manage_wheel, {passive: false, signal: wheel_abort.signal});
		document.addEventListener('mousemove', prevent_menu, {once: true, signal: mousemove_abort.signal});
	}
}

document.addEventListener('mousedown', load_menu);
