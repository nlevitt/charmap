function Chartable(table)
{
	/* private variables */

	var maxWidth = 1;
      	var maxHeight = 1;
	var numRows = 1;
	var numCols = 1;
	var activeCh = -1;
	var fontSizePx = 40;
	var cssCharcellRuleIndex = -1;
	var cells = false;
	var characters;
	var onCellMouseover = false;
	var onActiveCellChange = false;

	/* public variables */

	/* private methods */

	var handleCellMouseover = function (event)
	{
		var cell = getTarget(event);
		// log('handleCellMouseover getTarget(event).id=' + cell.id);
		if (onCellMouseover)
			onCellMouseover(cell.id);

		if (cell.id != activeCh)
		{
			// .charcell:hover  { border-style:outset; background-color:#ff6; }
			cell.style.borderStyle = 'outset';
			cell.style.backgroundColor = '#ffc';
		}
	};

	var handleCellMouseout = function (event)
	{
		var cell = getTarget(event);

		if (cell.id != activeCh)
		{
			// undo .charcell:hover  { border-style:outset; background-color:#ff6; }
			cell.style.borderStyle = 'solid';
			cell.style.backgroundColor = '#fff';
		}
	};

	var setActiveCh = function (ch)
	{
		activeCh = Number(ch);
		var cell = cells[activeCh];
		log('chartable.setActiveCh() ch='+ch+' cell='+cell);
		if (cell)
		{
			cell.style.borderStyle = 'inset';
			cell.style.backgroundColor = '#ff9';
		}
	};

	var unsetActiveCh = function ()
	{
		log('chartable.unsetActiveCh() activeCh=' + activeCh + ' cells[activeCh]=' + cells[activeCh]);
		if (activeCh >= 0)
		{
			if (cells[activeCh])
			{
				cells[activeCh].style.borderStyle = 'solid';
				cells[activeCh].style.backgroundColor = '#fff';
			}
			activeCh = -1;
		}
	};

	var handleCellClick = function(event) {
		var cell = getTarget(event);
		log('chartable.handleCellClick() event=' + event + ' cell.id=' + ustring(cell.id) + ' onActiveCellChange=' + onActiveCellChange);

		if (cell.id != activeCh)
		{
			unsetActiveCh();
			setActiveCh(cell.id);
			if (onActiveCellChange) {
				onActiveCellChange(cell.id, true);
			}
		}
	};

	var initEmptyCharCell = function (cell) 
	{
		// log('initEmptyCharCell cell=' + cell);
		cell.className = 'empty';
		cell.innerHTML = '';
		cell.style.cssText = '';
		cell.onmouseover = null;
		cell.onmouseout = null;
		cell.onclick = null;
	};

	var initCharCell = function (cell,ch) 
	{
		// log('initCharCell cell=' + cell + ' ch=' + ch);
		cell.id = ch;
		cell.innerHTML = '';
		cell.className = '';

		if (ch >= 0 && ch <= 0xffff)
		{
			// doesn't seem to work above U+FFFF
			var charstr = String.fromCharCode(ch);
			cell.appendChild(document.createTextNode(charstr));
		}
		else if (ch <= UNICODE_MAX)
			cell.innerHTML = '&#' + ch + ';';

		if (ch == activeCh)
		{
			cell.style.borderStyle = 'inset';
			cell.style.backgroundColor = '#ff9';
		}
		else
			cell.style.cssText = '';

		cell.onmouseover = handleCellMouseover;
		cell.onmouseout = handleCellMouseout;
		cell.onclick = handleCellClick;

		cells[ch] = cell;
	};

	var getCssRules = function() {
		var cssRules = false;
		if (document.styleSheets && document.styleSheets[0] && document.styleSheets[0].cssRules) {
			return document.styleSheets[0].cssRules;
		} else if (document.styleSheets && document.styleSheets[0] && document.styleSheets[0].rules) {
			return document.styleSheets[0].rules;
		} else {
			log('chartable.getCssRules() WARNING no css rules, what browser is this anyway');
			return false
		}
	}

	// first rule is the #chartable td{} rule
	var setCharcellCssRule = function (fontSizePx,widthPx,heightPx)
	{
		log('chartable.setCharcellCssRule() fontSizePx=' + fontSizePx + ' heightPx=' + heightPx + ' widthPx=' + widthPx);

		if (getCssRules()) {
			// sanity check to avoid error in ie
			if (fontSizePx > 0 && fontSizePx <= 10000) {
				getCssRules()[0].style.fontSize = fontSizePx + 'px';
			}
			if (widthPx >= 0 && widthPx <= 10000) {
				getCssRules()[0].style.width = widthPx + 'px';
			}
			if (heightPx >= 0 && heightPx <= 10000) {
				getCssRules()[0].style.height = heightPx + 'px';
			}
		}

		// log('chartable.setCharcellCssRule() set rule cssRules[0].cssText=' + cssRules[0].cssText);
	};

	// sets numrows and numcols and sets charcell css size
	var doResize = function ()
	{
		for (var row = table.rows.length - 1; row >= 0; row--)
			table.deleteRow(row);

		// log('chartable.doResize() before calling setCharcellCssRule(fontSizePx='+fontSizePx+', heightPx='+(fontSizePx*2)+' ,widthPx=' + (fontSizePx*2) + ') td.offsetHeight=' 
		// setCharcellCssRule(fontSizePx,fontSizePx*2,fontSizePx*2);
		var tr = table.insertRow(-1);
		var td = tr.insertCell(-1); 
		td.style.fontSize = fontSizePx + 'px';
		td.style.width = (fontSizePx*2) + 'px';
		td.style.height = (fontSizePx*2) + 'px';
		td.innerHTML = 'm';

		log('chartable.doResize() maxHeight=' + maxHeight + ' maxWidth=' + maxWidth + ' td.style.width=' + td.style.width + ' td.style.height=' + td.style.height + ' table.offsetWidth=' + table.offsetWidth + ' table.offsetHeight=' + table.offsetHeight);
		numRows = Math.round(maxHeight / table.offsetHeight);
		cssHeightPx = Math.floor(maxHeight / numRows) - (table.offsetHeight - fontSizePx*2);

		numCols = Math.round(maxWidth / table.offsetWidth);
		cssWidthPx = Math.floor(maxWidth / numCols) - (table.offsetWidth - fontSizePx*2);

		setCharcellCssRule(fontSizePx,cssWidthPx,cssHeightPx);
		log('chartable.doResize() finished #chartable td{width:' + getCssRules()[0].style.width + ';height:' + getCssRules()[0].style.height + '} numRows=' + numRows + ' numCols=' + numCols);
	};

	// use when there's been no resizing
	var quickRedraw = function ()
	{
		log('chartable.quickRedraw() numRows=' + numRows + ' numCols=' + numCols);
		cells = {};

		for (var row = 0; row < numRows; row++)
		{
			for (var col = 0; col < numCols; col++)
			{
				if (row*numCols + col < characters.length)
					initCharCell(table.rows[row].cells[col], characters[row*numCols + col]);
				else
					initEmptyCharCell(table.rows[row].cells[col]);
			}
		}
	};

	/* public methods */

	this.isVisible = function (ch)
	{
		log('chartable.isVisible(' + ustring(ch) + ')=' + (indexOf(characters, ch) != -1));
		return indexOf(characters, ch) != -1;
	};

	this.getActiveChIndex = function ()
	{
		// log('chartable.getActiveChIndex() activeCh=' + activeCh + ' this.getFirstCh()=' + this.getFirstCh() + ' this.getLastCh()=' + this.getLastCh() + ' characters.indexOf(activeCh)=' + characters.indexOf(activeCh));
		// return characters.indexOf(activeCh);
		for (var i = 0; i < characters.length; i++)
			if (characters[i] == activeCh)
				return i;

		return -1;
	};

	this.getFirstCh = function ()
	{
		return characters[0];
	};

	this.getLastCh = function ()
	{
		return characters[numRows * numCols - 1];
	};

	this.getCharacter = function (i)
	{
		return characters[i];
	};

	// XXX
	this.getCharacters = function ()
	{
		return characters;
	};

	this.redraw = function () 
	{
		log('chartable.redraw() numRows=' + numRows + ' numCols=' + numCols);
		cells = {};
		for (var row = table.rows.length - 1; row >= 0; row--)
			table.deleteRow(row);

		for (var row = 0; row < numRows; row++)
		{
			// log('adding row ' + row);
			var tr = table.insertRow(-1); // document.createElement('tr');

			for (var col = 0; col < numCols; col++)
			{
				var td = tr.insertCell(-1); 
				if (row*numCols + col < characters.length)
					initCharCell(td, characters[row*numCols + col]);
				else
					initEmptyCharCell(td);
			}
		}
	};

	this.setCharacters = function (chs)
	{
		characters = chs;
		log('chartable.setCharacters() ' + characters.length + ' characters: ' + characters[0] + '...' + characters[characters.length-1]);
		quickRedraw();
	};

	this.resize = function (newMaxWidth,newMaxHeight)
	{
		maxWidth = newMaxWidth;
		maxHeight = newMaxHeight;

		if (table.offsetWidth > maxWidth || table.offsetHeight > maxHeight ||
				maxWidth - table.offsetWidth > fontSizePx / 2 || maxHeight - table.offsetHeight > fontSizePx / 2)
		{
			doResize();
			this.redraw();
		}
	};

	this.setFontSizePx = function (newFontSizePx)
	{
		log('chartable.setFontSizePx() fontSizePx=' + fontSizePx + ' newFontSizePx=' + newFontSizePx);
		if (newFontSizePx != fontSizePx)
		{
			fontSizePx = newFontSizePx;
			doResize();
			this.redraw();
		}
	};

	this.getFontSizePx = function ()
	{
		return fontSizePx;
	};

	// returns -1 if none set
	this.getActiveCh = function ()
	{
		return activeCh;
	};

	this.setActiveCh = function (ch)
	{
		log('chartable.setActiveCh() ch=' + ch);
		unsetActiveCh();
		setActiveCh(ch);
	};

	this.getNumCols = function ()
	{
		return numCols;
	};

	this.getNumRows = function ()
	{
		return numRows;
	};

	this.setActiveCellChange = function (handler)
	{
		onActiveCellChange = handler;
	};

	this.setCellMouseover = function (handler)
	{
		onCellMouseover = handler;
	};
}

