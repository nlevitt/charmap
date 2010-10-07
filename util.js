var UNICODE_MAX = 0x10ffff;

function ustring(wc) 
{
	var hex = Number(wc).toString(16).toUpperCase();
	if (hex.length == 1)
		return 'U+000' + hex;
	else if (hex.length == 2)
		return 'U+00' + hex;
	else if (hex.length == 3)
		return 'U+0' + hex;
	else 
		return 'U+' + hex;
}

function getTopLeft(obj) 
{
	var curleft = curtop = 0;

	if (obj.offsetParent) 
	{
		curleft = obj.offsetLeft;
		curtop = obj.offsetTop;
		while (obj = obj.offsetParent) 
		{
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		}
	}

	return {top:curtop,left:curleft};
}

function stopEvent(event) 
{
        if (window.event) // IE
		window.event.cancelBubble = true; // for IE
	else // non-IE
	{
		if (event.eventPhase == 1)
			window.alert("error: stopPropogation used for capturing phase");
		else
			event.stopPropagation();
	}
}

function getMousePoint(event)
{
	var posx = 0;
	var posy = 0;

	if (!event)
		event = window.event;

	if (event.pageX || event.pageY)
	{
		posx = event.pageX;
		posy = event.pageY;
	}
	else if (event.clientX || event.clientY)
	{
		posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	return {x:posx,y:posy};
}

// for ie (done with css in firefox)
function disableTextSelection()
{
	// http://www.ditchnet.org/wp/2005/06/15/ajax-freakshow-drag-n-drop-events-2/
	document.body.ondrag = function() { return false; };
	document.body.onselectstart = function() { return false; };
}

// for ie (done with css in firefox)
function enableTextSelection()
{
	document.body.ondrag = null;
	document.body.onselectstart = null;
}

function log(message) 
{
	// alert(message);

	var now = new Date();
	var timestamp = (1 + now.getHours() / 100).toFixed(2).substr(2) + ':' + (1 + now.getMinutes() / 100).toFixed(2).substr(2) + ':' + (1 + now.getSeconds() / 100).toFixed(2).substr(2) + '.' + (1 + now.getMilliseconds() / 1000).toFixed(3).substr(2);

	if (window.console)
		window.console.log(timestamp + ' - ' + message);
	else if (document.getElementById('log'))
	{
		var line = document.createElement('div');
		line.innerHTML = timestamp + ' -    ';
		line.appendChild(document.createTextNode(message));
		document.getElementById('log').appendChild(line);
	}
}

function getTarget(event)
{
        var target;

        if (!event)
                event = window.event;

        if (event.target)
                target = event.target;
        else
                if (event.srcElement) target = event.srcElement;

        if (target.nodeType == 3) // defeat Safari bug
                target = target.parentNode;

        return target;
}

function clamp(x,low,high)
{
	if (x < low)
		return low;
	else if (x > high)
		return high;
	else
		return x;
}

function indexOf(list,item)
{
	if (list.indexOf)
		return list.indexOf(item); // js 1.6
	else
		for (var i=0; i < list.length; i++)
			if (list[i] == item)
				return i;

	return -1;
};

