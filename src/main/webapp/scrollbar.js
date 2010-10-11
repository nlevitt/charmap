function VScrollbar(scrollbarElement,scrollbarInsizerElement,chartableElement)
{
	// private 

	var scrollHandler = false;
	var timeoutId = false;
	var ignoreScrollEvent = false;

	var onscrollHandler = function onscrollHandler(event)
	{
		if (ignoreScrollEvent)
		{
			log('scrollbar.onscrollHandler() ignoring event');
			ignoreScrollEvent = false;
			return;
		}

		log('scrollbar.onscrollHandler() timeoutId=' + timeoutId);
		log('scrollbar.onscrollHandler() event.type=' + event.type + ' event.target=' + event.target + ' event.currentTarget=' + event.currentTarget + ' event.eventPhase=' + event.eventPhase + ' event.bubbles=' + event.bubbles + ' event.cancelable=' + event.cancelable + ' event.timeStamp=' + event.timeStamp);

		if (timeoutId)
			window.clearTimeout(timeoutId);

		timeoutId = window.setTimeout(sendScrollEvent, 100, scrollbarElement.scrollTop);
	};

        var sendScrollEvent = function sendScrollEvent()
        {
                log('scrollbar.sendScrollEvent() scrollHandler.name=' + scrollHandler.name);
                if (scrollHandler)
                        scrollHandler(scrollbarElement.scrollTop);
        };

	// public 

	this.redraw = function redraw(viewCharCount, pageHeightPx, numRows, numCols)
	{
		scrollbarElement.style.height = pageHeightPx + 'px';
		scrollbarInsizerElement.style.height = Math.round(pageHeightPx + (viewCharCount - numRows*numCols)) + 'px';
		log('scrollbar.redraw() numRows=' + numRows + ' numCols=' + numCols + ' viewCharCount=' + viewCharCount + ' pageHeightPx=' + pageHeightPx + ' scrollbarInsizerElement.style.height=' + scrollbarInsizerElement.style.height);
	};

        this.setScrollHandler = function setScrollHandler(handler)
        {
                scrollHandler = handler;
        };

	this.setScrollTop = function setScrollTop(newScrollTop)
	{
		log('scrollbar.setScrollTop() newScrollTop=' + newScrollTop);

		// just go, don't send a scroll event
		if (newScrollTop != scrollbarElement.scrollTop)
		{
			ignoreScrollEvent = true;
			scrollbarElement.scrollTop = newScrollTop;
		}
	};

	this.getScrollTop = function getScrollTop()
	{
		return scrollbarElement.scrollTop;
	};

	scrollbarElement.onscroll = onscrollHandler;
}
