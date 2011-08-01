package org.pseudorandom.unicode;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.ListIterator;

import org.apache.log4j.Logger;

public class UnicodeSubset
{
	private static Logger log = Logger.getLogger(UnicodeSubset.class);

	private class Range {
		int ch0;
		int ch1;

		Range(int ch0, int ch1) {
			this.ch0 = ch0;
			this.ch1 = ch1;
		}

		public String toString() {
			return UnicodeInfo.getHexString(ch0) + ".." + UnicodeInfo.getHexString(ch1);
		}
	}

	private LinkedList<Range> ranges;
	private String name;
	private int count;

	UnicodeSubset(String name)
	{
		this.name = name;
		this.ranges = new LinkedList<Range>();
		this.count = 0;
	}

	public String getName()
	{
		return name;
	}

	public int getCount()
	{
		return count;
	}

	// XXX smart insertion
	void addCharacter(int ch)
	{
		addRange(ch, ch);
	}

	// XXX smart insertion
	void addRange(int ch0, int ch1) {
		dumbAddRange(ch0, ch1);
		consolidateRanges();
	}
	
	// ranges must be sorted
	protected void consolidateRanges() {
		Range thisRange = null;
		Range lastRange = null;
		
		ListIterator<Range> listIter = ranges.listIterator();
		while (listIter.hasNext()) {
			lastRange = thisRange;
			thisRange = listIter.next();
			
			if (lastRange != null && lastRange.ch1 + 1 >= thisRange.ch0) {
				lastRange.ch1 = Math.max(lastRange.ch1, thisRange.ch1);
				listIter.remove();
			}
		}
	}

	protected void dumbAddRange(int ch0, int ch1)
	{
		count += ch1 - ch0 + 1;

		int i = 0;
		for (Range range: ranges)
		{
			if (ch1 >= range.ch0 && ch0 < range.ch0) {
				ranges.add(i, new Range(ch0, ch1));
				// log.debug("UnicodeSubset.addRange() ch0=" + ch0 + " ch1=" + ch1 + " -> " + toString());
				return;
			}
			i++;
		}

		ranges.add(new Range(ch0, ch1));
		// log.debug("UnicodeSubset.addRange() ch0=" + ch0 + " ch1=" + ch1 + " -> " + toString());
	}

	int getCharacter(int index) {
		int i = 0;

		for (Range range: ranges) {
			if (i + range.ch1 - range.ch0 >= index) {
				return range.ch0 + index - i;
			} else {
				i += range.ch1 - range.ch0 + 1;
			}
		}

		log.warn("UnicodeInfo.UnicodeSubset.getCharacter() out of range index >= count (" + index + " >= " + count + ")");
		return -1;
	}

	public String toString()
	{
		StringBuilder buf = new StringBuilder("'" + name + "'[" + count + "]=");
		for (Range range: ranges) {
			buf.append(range.ch0 + "-" + range.ch1 + ",");
		}

		return buf.toString();
	}
	
	public String getRangeString() {
		StringBuilder buf = new StringBuilder();
		boolean first = true;
		for (Range range: ranges) {
			if (!first) {
				buf.append(',');
			} else {
				first = false;
			}
			buf.append(range.toString());
		}
		
		return buf.toString();
	}

	public Collection<Integer> getCharacters(int i0, int count) {
		ArrayList<Integer> chars = new ArrayList<Integer>();
		int subsetIndex = 0;

		Iterator<Range> rangeIter = ranges.iterator();
		while (rangeIter.hasNext() && chars.size() < count) {
			Range range = rangeIter.next();

			if (subsetIndex + range.ch1 - range.ch0 >= i0) {
				int ch0;

				if (i0 > subsetIndex) {
					ch0 = range.ch0 + i0 - subsetIndex;
					subsetIndex = i0;
				} else {
					ch0 = range.ch0;
				}

				for (int ch = ch0; ch <= range.ch1 && chars.size() < count; ch++) {
					chars.add(ch);
					subsetIndex++;
				}
			} else {
				subsetIndex += range.ch1 - range.ch0 + 1;
			}
		}

		log.debug("i0=" + i0 + " count=" + count + " returning " + chars);

		return chars;
	}
}

