function Charmap()
{
	/* private variables */

	var viewElement = document.getElementById('view');
	var chartableElement = document.getElementById('chartable');
	var scrollbarElement = document.getElementById('scrollbar');
	var scrollbarInsizerElement = document.getElementById('scrollbar-insizer');
	var elementAbove = document.getElementById('top-left');
	var elementBelow = document.getElementById('bottom-left');
	var statusElement = document.getElementById('status');
	var searchStatusElement = document.getElementById('search-status');
	var balloonElement = document.getElementById('balloon');
	var balloonBigcharElement = document.getElementById('balloon-bigchar');
	var balloonContentElement = document.getElementById('balloon-content');
	var boldButtonElement = document.getElementById('bold-button');
	var italicButtonElement = document.getElementById('italic-button');
	var biggerButtonElement = document.getElementById('bigger-button');
	var smallerButtonElement = document.getElementById('smaller-button');
	var searchForm = document.getElementById('search');
	var searchInput = document.getElementById('search-input');

	var view = viewElement.value;
	var chartable = new Chartable(chartableElement);
	var scrollbar = new VScrollbar(scrollbarElement,scrollbarInsizerElement,chartableElement);
	var balloon = new Balloon(balloonElement,balloonBigcharElement,balloonContentElement,this);
	var detailsHttp = false;
	var searchHttp = false;
	var jumpSearchHttp = false;
	var details = false;
	var viewCharCount = 0;
	var onViewChange = function () { log('charmap.onViewChange() not handled'); };
	var newActiveChIndex = -1;
	var scrollTimeoutId = false;

	/* public variables */

	/* private methods */

	var activeCellChange = function (ch,active)
	{
		log('charmap.activeCellChange() ch=' + ch + 'active=' + active);
		if (active) {
			showBalloon(ch);
		}
	};

	// firefox: e=[object MouseScrollEvent] e.wheelDelta=undefined e.detail=-3 e.axis=2 e.wheelDeltaX=undefined e.wheelDeltaY=undefined
	// chrome:  e=[object WheelEvent] e.wheelDelta=-6360 e.detail=0 e.axis=undefined e.wheelDeltaX=0 e.wheelDeltaY=-6360
	var mouseWheelSpin = function (evt) {
		e = evt || window.event;

		deltaY = 0;
		if (e.axis) {
			if (e.axis == 2) {
				deltaY = e.detail;
			} // else other axis, ignore
		} else if (e.wheelDeltaY) {
			deltaY = -e.wheelDeltaY / 600;
		} else if (e.wheelDelta) {
			deltaY = -e.wheelDelta / 600;
		} else if (e.detail) {
			deltaY = e.detail;
		}

		log('charmap.mouseWheelSpin() deltaY=' + deltaY + ' e=' + e + ' e.wheelDelta=' + e.wheelDelta + ' e.detail=' + e.detail 
				+ ' e.axis=' + e.axis + ' e.wheelDeltaX=' + e.wheelDeltaX + ' e.wheelDeltaY=' + e.wheelDeltaY);

		// scrollbar seems to handle going too far in either direction itself... w00t!
		prevScrollTop = scrollbar.getScrollTop();
		scrollbar.setScrollTop(scrollbar.getScrollTop() + deltaY * chartable.getNumCols());

		if (scrollbar.getScrollTop() != prevScrollTop) {
			if (scrollTimeoutId) {
				log('charmap.mouseWheelSpin() cancelling previous scrollTimeoutId=' + scrollTimeoutId);
				window.clearTimeout(scrollTimeoutId);
			}
			scrollTimeoutId = window.setTimeout(
				function() {
					retrieveDetails(view, getI0(scrollbar.getScrollTop()), chartable.getNumRows() * chartable.getNumCols(), noScrollbarUpdateDetailsHandler);
					scrollTimeoutId = false;
				}, 
				100, deltaY);
		}
	}

	var setStatusCh = function (ch)
	{
		// log('cellMouseover ch=' + ch);
		if (details)
		{
			var message = '';

			// statusElement.innerHTML = '<tt>' + ustring(ch) + '</tt> ';
			statusElement.innerHTML = ustring(ch) + '\t';
			statusElement.appendChild(document.createTextNode(message));
			if (details[ch])
				statusElement.appendChild(document.createTextNode(details[ch].name));
			else
				statusElement.appendChild(document.createTextNode('(unknown)'));
		}
	};

	var showBalloon = function showBalloon(ch,detail)
	{
		log('charmap.showBalloon() ch=' + ch + ' detail=' + detail + ' details[ch]=' + (details && details[ch]));

		if (detail)
			balloon.setContents(detail);
		else if (details && details[ch])
			balloon.setContents(details[ch]);
		else if (details)
			balloon.setUnknown(ch);
		else
			balloon.setWaiting(ch);
	};	

	/*
	 * 	ResponseObject
	 * 	{
	 * 		private int count;
	 * 		private SearchResult result;
	 * 	}
	 * 
	 * 	SearchResult
	 * 	{
	 * 		int index;
	 * 		int ch;
	 * 		String view;
	 * 		int i; // index within view
	 * 		CharInfo detail;
	 * 	}
	 */
	var searchResponseHandler = function (responseText)
	{
		handleSearchResponse(responseText, true);
	};

	var searchResponseHandlerForJump = function (responseText)
	{
		handleSearchResponse(responseText, false);
	};

	var handleSearchResponse = function (responseText, setSearchStatus)
	{
		log('charmap.searchResponseHandler() responseText=' + responseText);
		if (responseText)
		{
			try
			{
				var response = eval('(' + responseText + ')');
				if (response && response.count != 0)
				{
					if (setSearchStatus)
						searchStatusElement.innerHTML = (response.result.index+1) + ' of ' + response.count;
					details[response.result.ch] = response.result.detail;

					jump(response.result.ch, true);
				}
				else if (setSearchStatus)
					searchStatusElement.innerHTML = 'not found';
			}
			catch (e)
			{
				log('charmap.searchResponseHandler() problem evaluating search response responseText='+ responseText + ' exception: ' + e);
				if (setSearchStatus)
					searchStatusElement.innerHTML = 'unexpected search response from server';
			}
		}
		else // if (setSearchStatus)
			searchStatusElement.innerHTML = 'responseText=' + responseText;
	}

	var jump = function (ch, updateViewFromScript)
	{
		log('charmap.jump() ch=' + ch + ' details=' + details + ' details[ch]=' + details[ch]);
		if (details && details[ch])
		{
			log('charmap.jump() ch=' + ch + ' details[ch]=' + details[ch] + ', jumping');
			doJump(ch, details[ch], updateViewFromScript);
		}
		else
		{
			log('charmap.jump() ch=' + ch + ' no details, searching for ' + String.fromCharCode(ch));
			if (!jumpSearchHttp)
				jumpSearchHttp = new Http(searchResponseHandlerForJump);

			var queryUrl = 'search?ch=' + ch;

			log('charmap.jump() making request: ' + queryUrl);
			jumpSearchHttp.request(queryUrl);
		}
	};

	var moveActiveCh = function (n)
	{
		log('charmap.moveActiveCh() [0] n=' + n + ' chartable.getActiveCh()=' + chartable.getActiveCh() + ' chartable.getActiveChIndex()=' + chartable.getActiveChIndex() + ' chartable.getCharacters()=' + chartable.getCharacters() + ' chartable.getCharacters().length=' + chartable.getCharacters().length);

		if (!details || !details[chartable.getFirstCh()]) // || (chartable.getActiveCh() != -1 && !details[chartable.getActiveCh()]))
		{
			log('charmap.moveActiveCh() warning, not doing anything: details=' + details);
			return;
		}

		if (chartable.getActiveCh() == -1 || !chartable.isVisible(chartable.getActiveCh()))
		{
			// log('charmap.moveActiveCh() [1] chartable.getActiveCh()=' + chartable.getActiveCh() + ' not doing anything');
			log('charmap.moveActiveCh() [1] chartable.getActiveCh()=' + chartable.getActiveCh() + ' calling jump() chartable.getFirstCh()=' + chartable.getFirstCh());
			jump(chartable.getFirstCh(), false);
		}
		else if (chartable.getActiveChIndex() != -1 && chartable.getCharacter(chartable.getActiveChIndex() + n) != undefined)
		{
			log('charmap.moveActiveCh() [2] calling jump() chartable.getCharacter(chartable.getActiveChIndex()+n)=' + chartable.getCharacter(chartable.getActiveChIndex()+n));
			jump(chartable.getCharacter(chartable.getActiveChIndex() + n), false);
		}
		else if (chartable.isVisible(chartable.getActiveCh()) && getI0(scrollbar.getScrollTop()) + chartable.getActiveChIndex() + n >= 0 && getI0(scrollbar.getScrollTop()) + chartable.getActiveChIndex() + n < viewCharCount && !chartable.getCharacter(chartable.getActiveChIndex() + n))
		{
			log('charmap.moveActiveCh() [3] chartable.getActiveCh()=' + chartable.getActiveCh() + ' chartable.getActiveChIndex()=' + chartable.getActiveChIndex() + ' chartable.getCharacter(chartable.getActiveChIndex()+n)=' + chartable.getCharacter(chartable.getActiveChIndex()+n));

			var newScrollTop;

			if (n >=0)
				newScrollTop = getI0(scrollbar.getScrollTop()) + chartable.getNumCols() * Math.floor((n + chartable.getNumCols() - 1) / chartable.getNumCols());
			else
				newScrollTop = getI0(scrollbar.getScrollTop()) + chartable.getNumCols() * Math.floor(n / chartable.getNumCols());

			log('charmap.moveActiveCh() [3.1] getI0(scrollbar.getScrollTop())=' + getI0(scrollbar.getScrollTop()) + ' scrollbar.getScrollTop()=' + scrollbar.getScrollTop() + ' newScrollTop=' + newScrollTop);
				
			// log('charmap.moveActiveCh() [3.2] scrollbar.getScrollTop()=' + scrollbar.getScrollTop() + ' newScrollTop=' + newScrollTop);
			newActiveChIndex = chartable.getActiveChIndex() + n - (newScrollTop - getI0(scrollbar.getScrollTop()));
			chartable.setActiveCh(-1);
			retrieveDetails(view, newScrollTop, chartable.getNumRows() * chartable.getNumCols(), scrollbarUpdateDetailsHandler);
			scrollbar.setScrollTop(newScrollTop);
		}
		else
			log('charmap.moveActiveCh() [4] NOT IMPLEMENTED chartable.getActiveCh()=' + chartable.getActiveCh() + ' chartable.getActiveChIndex()=' + chartable.getActiveChIndex() + ' chartable.getCharacter(chartable.getActiveChIndex()+n)=' + chartable.getCharacter(chartable.getActiveChIndex()+n));
	};

	var doJump = function (ch, detail, updateViewFromScript)
	{
		log('charmap.doJump() ch=' + ch + ' detail=' + detail);

		if (updateViewFromScript && view != detail.script)
		{
			view = detail.script + ';;';
			onViewChange(view);
		}

		if (!chartable.isVisible(ch))
		{
			retrieveDetails(view, detail.scriptIndex - (detail.scriptIndex % chartable.getNumCols()), chartable.getNumRows() * chartable.getNumCols(), scrollbarUpdateDetailsHandler);
			scrollbar.setScrollTop(detail.scriptIndex - (detail.scriptIndex % chartable.getNumCols()));

			// retrieveDetails() clears "details" (not without reason)
			details = new Object();
			details[ch] = detail; 
		}

		chartable.setActiveCh(ch);
		showBalloon(ch);
	};

	var handleDetailsResponse = function handleDetailsResponse(responseText, redrawScrollbar)
	{
		log('charmap.handleDetailsResponse() responseText.length=' + responseText.length);

		var results;

		try 
		{
			if (responseText)
				results = eval('(' + responseText + ')');

			statusElement.innerHTML = '&nbsp;';

			details = results.details;
			viewCharCount = results.viewCharCount;
		}
		catch (e)
		{
			alert('problem evaluating details response responseText=' + responseText + ' exception: ' + e);
			statusElement.innerHTML = 'unexpected response from server';
		}

		log('charmap.handleDetailsResponse() showing ' + results.characters.length + ' of ' + viewCharCount + ' "' + view + '" characters');

		chartable.setCharacters(results.characters);

		if (redrawScrollbar)
		{
			log('charmap.handleDetailsResponse() before scrollbar.redraw() scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
			scrollbar.redraw(viewCharCount, chartableElement.clientHeight, chartable.getNumRows(), chartable.getNumCols());
			log('charmap.handleDetailsResponse() after scrollbar.redraw() scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
		}

		if (newActiveChIndex != -1 && chartable.getCharacter(newActiveChIndex) != -1)
		{
			chartable.setActiveCh(chartable.getCharacter(newActiveChIndex));
			log('charmap.handleDetailsResponse() set new active character index newActiveChIndex=' + newActiveChIndex + ' chartable.getActiveChIndex()=' + chartable.getActiveChIndex() + ' (these should be the same) chartable.getActiveCh()=' + chartable.getActiveCh());
			newActiveChIndex = -1;
		}

		if (details[chartable.getActiveCh()])
			showBalloon(chartable.getActiveCh());

		log('charmap.handleDetailsResponse() finished');
	};

	var scrollbarUpdateDetailsHandler = function scrollbarUpdateDetailsHandler(responseText)
	{
		log('charmap.scrollbarUpdateDetailsHandler()' + ' scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
		handleDetailsResponse(responseText, true);
	};

	var noScrollbarUpdateDetailsHandler = function noScrollbarUpdateDetailsHandler(responseText)
	{
		log('charmap.noScrollbarUpdateDetailsHandler()' + ' scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
		handleDetailsResponse(responseText, false);
	};

	var retrieveDetails = function (view, i0, count, handler) 
	{ 
		statusElement.innerHTML = 'getting data...';

		if (!detailsHttp)
			detailsHttp = new Http(handler);
		else
			detailsHttp.setResponseHandler(handler);

		details = false;

		var requestUrl = 'details?view='+ view + '&i0='+ i0 +'&count='+ count;
		log('charmap.retrieveDetails() ' + requestUrl);
		detailsHttp.request(requestUrl);
	};

	var getI0 = function (scrollTop)
	{
		var n = (scrollTop + chartable.getNumCols() - 1);
		return n - (n % chartable.getNumCols());
	};

	var scrollHandler = function (scrollTop)
	{
		log('charmap.scrollHandler() scrollTop=' + scrollTop + ' scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
		retrieveDetails(view, getI0(scrollTop), chartable.getNumRows() * chartable.getNumCols(), noScrollbarUpdateDetailsHandler);
	};

	/* public methods */

	this.setOnViewChange = function (newOnViewChange) 
	{ 
		onViewChange = newOnViewChange; 
	};

	this.resize = function ()
	{
		var upperLeft = getTopLeft(chartableElement);
		upperLeft.top = elementAbove.offsetHeight + upperLeft.left;
		var lowerLeft = getTopLeft(elementBelow);

		log('charmap.resize() lowerLeft.top=' + lowerLeft.top + ' upperLeft.top=' + upperLeft.top + ' balloonElement.offsetWidth=' + balloonElement.offsetWidth);
		var maxHeight = lowerLeft.top - upperLeft.top - Math.floor(0.5 * upperLeft.left) - 2;
		var maxWidth = document.documentElement.clientWidth - balloonElement.offsetWidth - (2 * upperLeft.left);

		log('charmap.resize() document.documentElement.clientHeight=' + document.documentElement.clientHeight + ' maxWidth=' + maxWidth + ' maxHeight=' + maxHeight);
		chartable.resize(maxWidth,maxHeight);
		// scrollbar.redraw(viewCharCount, chartableElement.clientHeight, chartable.getNumRows(), chartable.getNumCols());
		balloon.setHeight(maxHeight);

		retrieveDetails(view, getI0(scrollbar.getScrollTop()), chartable.getNumRows() * chartable.getNumCols(), scrollbarUpdateDetailsHandler);
	};

	this.bigger = function ()
	{
		var newSize = clamp(chartable.getFontSizePx() + Math.floor(chartable.getFontSizePx() * 0.2), 6, 200);
		log('charmap.bigger() newSize=' + newSize + ' scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
		chartable.setFontSizePx(newSize);
		retrieveDetails(view, getI0(scrollbar.getScrollTop()), chartable.getNumRows() * chartable.getNumCols(), scrollbarUpdateDetailsHandler);
	};

	this.smaller = function ()
	{
		var newSize = clamp(chartable.getFontSizePx() - Math.floor(chartable.getFontSizePx() * 0.2), 6, 200);
		log('charmap.smaller() newSize=' + newSize + ' scrollbar.getScrollTop()=' + scrollbar.getScrollTop());
		chartable.setFontSizePx(newSize);
		retrieveDetails(view, getI0(scrollbar.getScrollTop()), chartable.getNumRows() * chartable.getNumCols(), scrollbarUpdateDetailsHandler);
	};

	this.findNext = function (query)
	{
		log('charmap.findNext() query=' + query);
		searchStatusElement.innerHTML = 'searching...';

		if (!searchHttp)
			searchHttp = new Http(searchResponseHandler);

		var ch0 = chartable.getActiveCh();
		if (ch0 == -1)
			ch0 = chartable.getFirstCh();

		var queryUrl = 'search?view=' + view + '&scrollTop=' + getI0(scrollbar.getScrollTop()) + '&ch0=' + ch0 + '&q=' + encodeURIComponent(query);

		log('charmap.findNext() making request: ' + queryUrl);
		searchHttp.request(queryUrl);
	};

	this.getDetails = function (ch)
	{
		if (details)
			return details[ch];
		else 
			return false;
	};

	this.setView = function (newView)
	{
		view = newView;
		log('charmap.setView() view=' + view + ' i0=' + 0 + ' count=' + chartable.getNumRows() * chartable.getNumCols());
		scrollbar.setScrollTop(0);
		retrieveDetails(view, 0, chartable.getNumRows() * chartable.getNumCols(), scrollbarUpdateDetailsHandler);
	};

	this.setFont = function (newFont)
	{
		log('charmap.setFont() chartableElement.style.fontFamily=' + chartableElement.style.fontFamily + ' newFont=' + newFont);
		chartableElement.style.fontFamily = newFont;
		balloon.setFont(newFont);
	};

	this.toggleBold = function ()
	{
		log('charmap.toggleBold() before toggling chartableElement.style.fontWeight=' + chartableElement.style.fontWeight);
		if (chartableElement.style.fontWeight == 'bold')
		{
			chartableElement.style.fontWeight = 'normal';
			boldButtonElement.style.borderStyle = 'solid';
		}
		else
		{
			chartableElement.style.fontWeight = 'bold';
			boldButtonElement.style.borderStyle = 'inset';
		}

		return chartableElement.style.fontWeight;
	};

	this.toggleItalic = function ()
	{
		log('charmap.toggleItalic() before toggling chartableElement.style.fontStyle=' + chartableElement.style.fontStyle);
		if (chartableElement.style.fontStyle == 'italic')
		{
			chartableElement.style.fontStyle = 'normal';
			italicButtonElement.style.borderStyle = 'solid';
		}
		else
		{
			chartableElement.style.fontStyle = 'italic';
			italicButtonElement.style.borderStyle = 'inset';
		}

		return chartableElement.style.fontStyle;
	};

	this.jump = function (ch)
	{
		jump(ch, true);
	};

	this.handleLinkMouseover = function (event)
	{
		var target = getTarget(event);
		log('main.js handleLinkMouseover() target='+ target + ' target.ch_=' + target.ch_);
		setStatusCh(target.ch_);
	};

	// XXX should this go in main.js?
	this.handleKeypress = function (event) 
	{ 
		event = event || window.event;

		log('charmap.handleKeypress() getTarget(event).nodeName=' + getTarget(event).nodeName + ' getTarget(event).id=' + getTarget(event).id + ' event.charCode=' + event.charCode + ' event.keyCode=' + event.keyCode + ' event.altKey=' + event.altKey + ' event.shiftKey=' + event.shiftKey + ' event.ctrlKey=' + event.ctrlKey + ' event.metaKey=' + event.metaKey); 

		targetNodeName = getTarget(event).nodeName.toLowerCase();
		if (targetNodeName != 'html' && targetNodeName != 'body' && targetNodeName != 'td')
		{
			// esc
			if (event.keyCode == 27) 
			{
				log('charmap.handleKeypress() calling getTarget(event).blur()');
				getTarget(event).blur();
			}
			else
				return;
		}

		keyCharCode = event.charCode || event.keyCode;

		// right arrow, 'l'
		if ((keyCharCode == 39 || keyCharCode == 63235 || keyCharCode == 'l'.charCodeAt()) && !event.shiftKey && !event.ctrlKey + !event.altKey + !event.metaKey)
			moveActiveCh(1);

		// left arrow, 'h'
		else if ((keyCharCode == 37 || keyCharCode == 63234 || keyCharCode == 'h'.charCodeAt()) && !event.shiftKey && !event.ctrlKey + !event.altKey + !event.metaKey)
			moveActiveCh(-1);

		// down arrow, 'j'
		else if ((keyCharCode == 40 || keyCharCode == 63233 || keyCharCode == 'j'.charCodeAt()) && !event.shiftKey && !event.ctrlKey + !event.altKey + !event.metaKey)
			moveActiveCh(chartable.getNumCols());

		// up arrow, 'k'
		else if ((keyCharCode == 38 || keyCharCode == 63232 || keyCharCode == 'k'.charCodeAt()) && !event.shiftKey && !event.ctrlKey + !event.altKey + !event.metaKey)
			moveActiveCh(-chartable.getNumCols());

		// 'b', 'B', any modifiers
		else if (keyCharCode == 'b'.charCodeAt() || keyCharCode == 'B'.charCodeAt())
			toggleBold();

		// 'i', 'I', any modifiers
		else if (keyCharCode == 'i'.charCodeAt() || keyCharCode == 'I'.charCodeAt())
			toggleItalic();

		else if (keyCharCode == '+'.charCodeAt() || keyCharCode == '='.charCodeAt())
			bigger();

		else if (keyCharCode == '-'.charCodeAt())
			smaller();

		else if (keyCharCode == 'n'.charCodeAt() || keyCharCode == 'N'.charCodeAt() || keyCharCode == 'g'.charCodeAt())
			findNext(searchForm.query.value);

		else if (keyCharCode == 's'.charCodeAt() || keyCharCode == 'S'.charCodeAt())
		{
			log('charmap.handleKeypress() calling searchInput.focus() searchInput=' + searchInput);
			searchInput.focus();
		}

		else if (keyCharCode == 'v'.charCodeAt() || keyCharCode == 'V'.charCodeAt())
		{
			log('charmap.handleKeypress() calling viewElement.focus() viewElement=' + viewElement);
			viewElement.focus();
		}

		// pgup
		else if (event.keyCode == 33 || event.keyCode == 63276)
			moveActiveCh(-chartable.getNumRows() * chartable.getNumCols());

		// pgdn
		else if (event.keyCode == 34 || event.keyCode == 63277)
			moveActiveCh(chartable.getNumRows() * chartable.getNumCols());
	};

	/* constructor logic */
	chartable.setFontSizePx(30);
	chartable.setActiveCellChange(activeCellChange); // onActiveCellChange = activeCellChange;
	chartable.setCellMouseover(setStatusCh); // onCellMouseover = setStatusCh;
	log('charmap.Charmap() chartable.onActiveCellChange=' + chartable.onActiveCellChange);
	if (chartableElement.addEventListener) {
		chartableElement.addEventListener('DOMMouseScroll', mouseWheelSpin, false);
		chartableElement.addEventListener('mousewheel', mouseWheelSpin, false);
	} else {
		chartableElement.onmousewheel = mouseWheelSpin;
	}

	var msg = "getting data, please wait...";
	var chs = new Array();
	for (var i = 0; i < msg.length; i++)
		chs.push(msg.charCodeAt(i));
	chartable.setCharacters(chs);

	this.resize();
	scrollbar.setScrollHandler(scrollHandler);
	this.setView(view);
};

