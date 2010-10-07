var charmap; 

function initialize()
{
	charmap = new Charmap();

	charmap.setOnViewChange(onViewChange);
	window.onresize = charmap.resize;
	document.onkeypress = charmap.handleKeypress;
}

function onViewChange(newView) 
{ 
	var selectElement = document.getElementById('view');
	log('main.js onViewChange() setting view=' + newView + " document.getElementById('view')=" + selectElement);

	selectElement.options.item(selectElement.selectedIndex).selected = false;
	selectElement.options.namedItem(newView).selected = true;
};

function bigger(event)
{
	charmap.bigger();
}

function smaller(event)
{
	charmap.smaller();
}

function findNext(query)
{
	if (query)
		charmap.findNext(query);
} 

function changeView(newView)
{
	log("main.js changeView() newView=" + newView);
	charmap.setView(newView);
}

function handleLinkClick(event) 
{ 
	var target = getTarget(event);
	log('main.js handleLinkClick() target='+ target + ' target.ch_=' + target.ch_);
	charmap.jump(target.ch_);
	return false; 
}

function toggleLog(button)
{
	var log = document.getElementById('log');
	if (log)
	{
		if (log.style.display == 'none')
		{
			log.style.display = 'block';
			button.style.borderStyle = 'inset';
		}
		else
		{
			log.style.display = 'none';
			button.style.borderStyle = 'solid';
		}
	}
}

function setFont(newFont)
{
	log('main.js setFont() newFont=' + newFont);
	charmap.setFont(newFont);
}

function toggleBold(button)
{
	log('main.js toggleBold()');
	charmap.toggleBold();
}

function toggleItalic(button)
{
	log('main.js toggleItalic()');
	charmap.toggleItalic();
}
