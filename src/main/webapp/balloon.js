function Balloon(balloonElement,balloonBigcharElement,balloonContentElement,charmap)
{
	var setBalloonBigChar = function(ch)
	{
		balloonBigcharElement.innerHTML = '';
		if (ch >= 0 && ch <= 0xffff)
		{
			// doesn't seem to work above U+FFFF
			var charstr = String.fromCharCode(ch);
			balloonBigcharElement.appendChild(document.createTextNode(charstr));
			log('set balloon bigchar=' + charstr);
		}
		else if (ch <= UNICODE_MAX)
		{
			balloonBigcharElement.innerHTML = '&#' + ch + ';';
			log('set balloon bigchar=' + '&#' + ch + ';');
		}
	}

	var makeCharLink = function(ch)
	{
		var link = document.createElement('a');
		link.href = '#';
		link.title = ustring(ch);
		link.ch_ = ch;
		link.onclick = handleLinkClick;
		link.onmouseover = charmap.handleLinkMouseover;
		return link;
	};

	var makeCharLinkName = function(ch)
	{
		var str = ustring(ch);
		if (charmap.getDetails(ch) && charmap.getDetails(ch).name)
			str += ' ' +  charmap.getDetails(ch).name;
		var link = makeCharLink(ch);
		link.appendChild(document.createTextNode(str));
		return link;
	};

	var makeCharLinkChar = function(ch)
	{
		log('making link char ch=' + ustring(ch));
		var link = makeCharLink(ch);
		link.appendChild(document.createTextNode(ustring(ch) + ' ‘'));
		var b = document.createElement('b');
		b.appendChild(document.createTextNode(String.fromCharCode(ch)));
		link.appendChild(b);
		link.appendChild(document.createTextNode('’'));
		return link;
	};	

	var makeExesList = function(items)
	{
		var ul = document.createElement('ul');

		for (var i = 0; i < items.length; i++)
		{
			// log('items[i]=' + items[i] + ' details[items[i]]=' + details[items[i]]); // + ' details[items[i]].name;

			var li = document.createElement('li');
			li.appendChild(makeCharLinkName(items[i]));
			ul.appendChild(li);
		}

		return ul;
	};

	var linkify = function(element,str)
	{
		str = ' ' + str + ' '; // make sure ie gives us strings on both ends

		var regex = /U[+][A-F0-9]{4,6}/g;
		var chars = str.match(regex);
		var strings = str.split(regex);
		log('linkify strings.length=' + (strings ? strings.length : '0') + ' chars.length=' + (chars ? chars.length : '0') + ' str="' + str + '" chars=[' + chars + '] strings=[' + strings + ']');

		var i;
		for (i = 0; i < strings.length - 1; i++)
		{
			element.appendChild(document.createTextNode(strings[i]));
			var ch = parseInt(chars[i].substring(2),16);
			element.appendChild(makeCharLinkChar(ch));
		}
		element.appendChild(document.createTextNode(strings[strings.length - 1]));
	};

	var makeList = function(items)
	{
		var ul = document.createElement('ul');
		log('makeList items=' + items);

		for (var i = 0; items && i < items.length; i++)
		{
			var li = document.createElement('li');
			linkify(li,items[i])
			ul.appendChild(li);
		}

		return ul;
	};

	this.setUnknown = function(ch)
	{
		balloonBigcharElement.innerHTML = '';
		balloonContentElement.innerHTML = '<h2>' + ustring(ch) + ' (unknown)</h2> <p> no information for this character </p>';
	}

	this.setWaiting = function(ch)
	{
		setBalloonBigChar(ch);
		balloonContentElement.innerHTML = '<h2>' + ustring(ch) + ' </h2> <p> getting data... </p>';
	}

	var categories = {'Lu':'Uppercase Letter', 'Ll':'Lowercase Letter', 'Lt':'Titlecase Letter', 'Lm':'Modifier Letter', 'Lo':'Other Letter', 'Mn':'Nonspacing Mark', 'Mc':'Spacing Combining Mark', 'Me':'Enclosing Mark', 'Nd':'Number, Decimal Digit', 'Nl':'Number, Letter', 'No':'Number, Other', 'Pc':'Punctuation, Connector', 'Pd':'Punctuation, Dash', 'Ps':'Punctuation, Open', 'Pe':'Punctuation, Close', 'Pi':'Punctuation, Initial quote', 'Pf':'Punctuation, Final quote', 'Po':'Punctuation, Other', 'Sm':'Math Symbol', 'Sc':'Currency Symbol', 'Sk':'Modifier Symbol', 'So':'Other Symbol', 'Zs':'Space Separator', 'Zl':'Line Separator', 'Zp':'Paragraph Separator', 'Cc':'Control', 'Cf':'Format', 'Cs':'Surrogate', 'Co':'Private Use', 'Cn':'Not Assigned'};

	var ccDesc = {0:'Base character or other non-combining character', 1:'Overlays and interior', 7:'Nuktas', 8:'Hiragana/Katakana voicing marks', 9:'Viramas', 10:'Start of fixed position classes', 199:'End of fixed position classes', 200:'Below left attached', 202:'Below attached', 204:'Below right attached', 208:'Left attached (reordrant around single base character)', 210:'Right attached', 212:'Above left attached', 214:'Above attached', 216:'Above right attached', 218:'Below left', 220:'Below', 222:'Below right', 224:'Left (reordrant around single base character)', 226:'Right', 228:'Above left', 230:'Above', 232:'Above right', 233:'Double below', 234:'Double above', 240:'Below (iota subscript)'};

	var getCcDesc = function getCcDesc(cc)
	{
		var desc = ccDesc[cc];
		if (desc)
			return desc;
		else
			return 'Unspecified type of combining character';
	}

	this.setContents = function(detail)
	{
		log('balloon.setContents detail=' + detail + ' detail.ch=' + detail.ch);
		setBalloonBigChar(detail.ch);

		balloonContentElement.innerHTML = '';

		var element = document.createElement('h2');
		element.style.marginBottom = '1em';
		balloonContentElement.appendChild(element);

		element.appendChild(document.createTextNode(ustring(detail.ch)));

		if (detail.name)
			element.appendChild(document.createTextNode(' ' + detail.name));

		if (detail.han && detail.han['kDef'])
		{
			balloonContentElement.appendChild(document.createTextNode('Definition'));
			var definitions = detail.han['kDef'].split(/[;,]/);
			var ol = document.createElement('ol');
			for (var i = 0; i < definitions.length; i++)
			{
				var li = document.createElement('li');
				li.appendChild(document.createTextNode(definitions[i]));
				ol.appendChild(li);
			}
			balloonContentElement.appendChild(ol);
		}

		if (detail.eq)
		{
			element = document.createElement('p');
			balloonContentElement.appendChild(element);

			element.appendChild(document.createTextNode('Alias names'));
			element.appendChild(makeList(detail.eq));
		}

		var table = document.createElement('table');
		table.style.clear = 'both';
		balloonContentElement.appendChild(table);

		var tr = table.insertRow(-1);
		tr.insertCell(-1).innerHTML = 'General&nbsp;Category';
		if (detail.gc)
			tr.insertCell(-1).innerHTML = categories[detail.gc] + ' (' + detail.gc + ')';
		else
			tr.insertCell(-1).innerHTML = '?';

		tr = table.insertRow(-1);
		if (!detail.cc)
			detail.cc = 0;
		tr.insertCell(-1).innerHTML = 'Combining&nbsp;Class';
		tr.insertCell(-1).innerHTML = getCcDesc(detail.cc) + ' (value=' + detail.cc + ')';

		tr = table.insertRow(-1);
		if (!detail.cc)
			detail.cc = 0;
		tr.insertCell(-1).innerHTML = 'Script';
		tr.insertCell(-1).innerHTML = detail.script;

		if (detail.han)
			for (var hanProp in detail.han)
			{
				tr = table.insertRow(-1);
				tr.insertCell(-1).innerHTML = 'detail.han[' + hanProp + ']';
				tr.insertCell(-1).innerHTML = detail.han[hanProp];
			}

		if (detail.strz)
		{
			element = document.createElement('p');
			balloonContentElement.appendChild(element);

			element.appendChild(document.createTextNode('Notes'));
			element.appendChild(makeList(detail.strz));
		}

		if (detail.colon)
		{
			element = document.createElement('p');

			element.appendChild(document.createTextNode('Equivalent to '));

			element.appendChild(makeCharLinkChar(detail.colon[0]));
			for (var i = 1; i < detail.colon.length; i++)
			{
				element.appendChild(document.createTextNode(' + '));
				element.appendChild(makeCharLinkChar(detail.colon[i]));
			}

			balloonContentElement.appendChild(element);
		}

		if (detail.lbs || detail.lbcs)
		{

			element = document.createElement('p');
			element.appendChild(document.createTextNode('Approximately equivalent to '));

			if (detail.lbs)
				element.appendChild(document.createTextNode(detail.lbs + ' '));

			element.appendChild(makeCharLinkChar(detail.lbcs[0]));
			for (var i = 1; i < detail.lbcs.length; i++)
			{
				element.appendChild(document.createTextNode(' + '));
				element.appendChild(makeCharLinkChar(detail.lbcs[i]));
			}

			balloonContentElement.appendChild(element);
		}

		if (detail.ex)
		{
			element = document.createElement('p');
			balloonContentElement.appendChild(element);

			element.appendChild(document.createTextNode('See also'));
			element.appendChild(makeExesList(detail.ex));
		}
	}

	this.setHeight = function (heightPx)
	{
		balloonElement.style.height = heightPx + 'px';
	}

	this.setFont = function (newFont)
	{
		log('balloon.setFont() newFont=' + newFont);
		balloonBigcharElement.style.fontFamily = newFont;
	}
}
