package org.pseudorandom.unicode;

import org.apache.log4j.Logger;

class SearchResult
{
	final int index;
	final int ch;
	final String view;
	final int i; // index within view
	final CharInfo detail;

	SearchResult(int index, int ch, String view, int i, CharInfo detail)
	{
		this.index = index;
		this.ch = ch;
		this.view = view;
		this.i = i;
		this.detail = detail;
	}

	public String toString()
	{
		return "U+" + UnicodeInfo.getHexString(ch);
	}
}
