/* vim: set sw=8 noet: */

package org.pseudorandom.unicode;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipInputStream;

import org.apache.log4j.Logger;

public class UnicodeInfo
{
	private static Logger log = Logger.getLogger(UnicodeInfo.class);

	@SuppressWarnings("unused")
	private static final int UNICODE_MAX = 0x10ffff;
	private static UnicodeInfo self = null;
	private LinkedHashMap<Integer,CharInfo> data;
	private HashMap<String,UnicodeSubset> scripts;
	private HashMap<String,UnicodeSubset> viewCache;

	private UnicodeInfo() throws IOException
	{
		data = new LinkedHashMap<Integer,CharInfo>();
		scripts = new HashMap<String,UnicodeSubset>();
		viewCache = new HashMap<String,UnicodeSubset>();

		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

		loadUnicodeData(new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("UnicodeData.txt"), "ASCII")));
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

		loadNameslist(new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("NamesList.txt"), "ISO8859-1")));
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

		loadScripts(new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("Scripts.txt"), "ASCII")));
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

		// 5.2 no longer has kDefinition and stuff, has indexes into dictionaries instead, but not online dictionaries!
		ZipInputStream zipinput = new ZipInputStream(getClass().getResourceAsStream("Unihan-5.1.zip"));
		zipinput.getNextEntry();
		loadUnihan(new BufferedReader(new InputStreamReader(zipinput, "UTF-8")));
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");
		
		zipinput = new ZipInputStream(getClass().getResourceAsStream("Unihan.zip"));
		zipinput.getNextEntry();
		loadUnihan(new BufferedReader(new InputStreamReader(zipinput, "UTF-8")));
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

		// zipinput = new ZipInputStream(getClass().getResourceAsStream("fc-lang.zip"));
		// loadFcLang();

		initAlgorithmicCharDetails();
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");
		
		initPrivateUseCharacters();
		log.debug("Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

		debug_logGcCounts();
	}

	/*
	 * "Properties. The Unicode Character Database provides default character
	 * properties, which implementations can use for the processing of
	 * private-use characters." 
	 * -- The Unicode Standard, Version 5.2, Section 16.5  
	 */
	private void initPrivateUseCharacters() {
		for (int ch = 0xe001; ch < 0xf8ff; ch++) {
			getData(ch).setName("<Private Use>");
			getData(ch).setCC(getData(0xe000).getCC());
			getData(ch).setGC(getData(0xe000).getGC());
		}
		for (int ch = 0xf0001; ch < 0xffffd; ch++) {
			getData(ch).setName("<Private Use>");
			getData(ch).setCC(getData(0xf0000).getCC());
			getData(ch).setGC(getData(0xf0000).getGC());
		}
		for (int ch = 0x100001; ch < 0x10fffd; ch++) {
			getData(ch).setName("<Private Use>");
			getData(ch).setCC(getData(0x100000).getCC());
			getData(ch).setGC(getData(0x100000).getGC());
		}
	}

	private CharInfo getData(int ch)
	{
		CharInfo details = data.get(ch);
		if (details == null)
		{
			details = new CharInfo(ch);
			data.put(ch, details);
		}

		return details;
	}

	// XXX buggy - "FORM FEED" becomes "FORM U+FEED"
	private String getNlValue(String nlLine)
	{
		// log.debug("\"" + nlLine.substring(3) +"\".replaceAll(\"\\b([0-9A-F]{4,6})\\b\", \"U+$1\") = " + nlLine.substring(3).replaceAll("\\b([0-9A-F]{4,6})\\b", "U+$1"));
		return nlLine.substring(3).replaceAll("\\b([0-9A-F]{4,6})\\b", "U+$1");
	}

	private Pattern fourHex = Pattern.compile("\\b[0-9A-F]{4,6}\\b");

	private int getNlCh(String nlLine)
	{
		Matcher matcher = fourHex.matcher(nlLine);
		matcher.find();
		return Integer.parseInt(matcher.group(), 16);
	}

	private Integer[] getNlChs(String nlLine)
	{
		Matcher matcher = fourHex.matcher(nlLine);

		int n = 0;
		while (matcher.find())
			n++;

		Integer[] results = new Integer[n];

		matcher.reset();
		n = 0;
		while (matcher.find())
		{
			results[n] = Integer.parseInt(matcher.group(), 16);
			n++;
		}

		return results;
	}

	private String getNlPoundString(String line)
	{
		// log.debug("getNlPoundString line=" + line);
		for (int i = 3; i < line.length(); i++)
			if ((line.charAt(i) >= '0' && line.charAt(i) <= '9') || (line.charAt(i) >= 'A' && line.charAt(i) <= 'F'))
			{
				// log.debug("getNlPoundString line=" + line + " returning substring (3," + (i-1) + ")");
				if (i > 3)
					return line.substring(3,i-1);
				else
					return "";
			}

		return line;
	}

	protected static final Set<String> HAN_WE_WANT = new HashSet<String>(Arrays.asList(new String[] { "kDefinition","kMandarin","kCantonese","kKorean","kHangul", "kJapaneseKun","kJapaneseOn","kFrequency","kSimplifiedVariant", "kTraditionalVariant" }));
	private void loadUnihan(BufferedReader reader) throws IOException
	{
		log.debug("loadUnihan() reader=" + reader);

		// U+3406  kIRG_JSource    4-212D
		Pattern pattern = Pattern.compile("U[+]([0-9A-F]{4,6})\\s+(\\w+)\\s+(.*)");
		int lastCh = 0;

		for (String line = reader.readLine(); line != null; line = reader.readLine())
		{
			// log.debug("read line: " + line);
			Matcher matcher = pattern.matcher(line);
			if (matcher.matches())
			{
				int ch = Integer.parseInt(matcher.group(1), 16);

				if (HAN_WE_WANT.contains(matcher.group(2).intern())) {
					getData(ch).setHanProperty(matcher.group(2).intern(), matcher.group(3));
				}

				if (ch != lastCh && ch % 0x400 == 0)
					log.debug("At Unihan line [" + line + "] Memory: " + Runtime.getRuntime().freeMemory()/1048576  + "M free; " + Runtime.getRuntime().maxMemory()/1048576 + "M max; " + Runtime.getRuntime().totalMemory()/1048576 + "M total");

				lastCh = ch;
			}
		}
	}

	private void loadScripts(BufferedReader reader) throws IOException
	{
		log.debug("loadScripts");

		// 0000..001F    ; Common # Cc  [32] <control-0000>..<control-001F>
		// 0020          ; Common # Zs       SPACE
		Pattern multiple = Pattern.compile("^([0-9A-F]{4,6})\\.\\.([0-9A-F]{4,6})\\s+; (\\w+) .*");
		Pattern single = Pattern.compile("^([0-9A-F]{4,6})\\s+; (\\w+) .*");

		for (String line = reader.readLine(); line != null; line = reader.readLine())
		{
			Matcher matcher = multiple.matcher(line);
			if (matcher.matches())
			{
				int ch0 = Integer.parseInt(matcher.group(1), 16);
				int ch1 = Integer.parseInt(matcher.group(2), 16);
				String script = matcher.group(3).replace('_', ' ');

				if (scripts.get(script) == null)
					scripts.put(script, new UnicodeSubset(script));

				for (int ch = ch0; ch <= ch1; ch++)
				{
					getData(ch).setScript(script);
					getData(ch).setScriptIndex(scripts.get(script).getCount() + ch - ch0);
				}

				scripts.get(script).addRange(ch0, ch1);
			}
			else
			{
				matcher = single.matcher(line);
				if (matcher.matches())
				{
					int ch = Integer.parseInt(matcher.group(1), 16);
					String script = matcher.group(2).replace('_', ' ');

					if (scripts.get(script) == null)
						scripts.put(script, new UnicodeSubset(script));

					getData(ch).setScript(script);
					getData(ch).setScriptIndex(scripts.get(script).getCount());

					scripts.get(script).addRange(ch, ch);
				}
			}
		}
	}

	private void loadNameslist(BufferedReader reader) throws IOException
	{
		log.debug("loadNameslist");
		int ch = -1;
		for (String line = reader.readLine(); line != null; line = reader.readLine())
		{
			if ((line.charAt(0) >= '0' && line.charAt(0) <= '9') || (line.charAt(0) >= 'A' && line.charAt(0) <= 'F'))
				ch = Integer.parseInt(line.substring(0,line.indexOf('\t')), 16);
			// log.debug("parsed ch=" + ch + " from line=" + line);
			else if (line.startsWith("\t="))
				getData(ch).addNlEqual(getNlValue(line));
			else if (line.startsWith("\t*"))
				getData(ch).addNlStar(getNlValue(line));
			else if (line.startsWith("\tx"))
				getData(ch).addNlEx(getNlCh(line));
			else if (line.startsWith("\t#"))
				getData(ch).setNlPound(getNlPoundString(line), getNlChs(line));
			else if (line.startsWith("\t:")) 
				getData(ch).setNlColon(getNlChs(line));
		}
	}

	private void loadUnicodeData(BufferedReader reader) throws IOException
	{
		log.debug("loadUnicodeData");
		for (String line = reader.readLine(); line != null; line = reader.readLine())
		{
			String[] split = line.split(";");

			int ch = Integer.parseInt(split[0], 16);
			CharInfo detail = getData(ch);
			detail.setName(split[1]);

			// general category
			detail.setGC(split[2]); 
			debug_incrementGcCount(split[2]);

			// combining class
			detail.setCC(Integer.parseInt(split[3]));  
		}
		log.debug("data.size() = " + data.size());
	}

	// package scope
	static String getHexString(int ch)
	{
		String rawHex = Integer.toHexString(ch).toUpperCase();
		if (rawHex.length() >= 4)
			return rawHex;
		else if (rawHex.length() == 3)
			return "0" + rawHex;
		else if (rawHex.length() == 2)
			return "00" + rawHex;
		else if (rawHex.length() == 1)
			return "000" + rawHex;
		else
			return rawHex;
	}

	/* constants for hangul (de)composition, see UAX #15 */
	private static final int SBase  = 0xAC00;
	private static final int LBase  = 0x1100;
	private static final int VBase  = 0x1161;
	private static final int TBase  = 0x11A7;
	private static final int LCount = 19;
	private static final int VCount = 21;
	private static final int TCount = 28;
	private static final int NCount = (VCount * TCount);
	private static final int SCount = (LCount * NCount);
	private static final String[] JAMO_L_TABLE = new String[] {"G","GG","N","D","DD","R","M","B","BB","S","SS","","J","JJ","C","K","T","P","H"};
	private static final String[] JAMO_V_TABLE = new String[] {"A","AE","YA","YAE","EO","E","YEO","YE","O","WA","WAE","OE","YO","U","WEO","WE","WI","YU","EU","YI","I"};
	private static final String[] JAMO_T_TABLE = new String[] {"","G","GG","GS","N","NJ","NH","D","L","LG","LM","LB","LS","LT","LP","LH","M","B","BS","S","SS","NG","J","C","K","T","P","H"};

	private void initAlgorithmicCharDetails()
	{
		for (int ch = 0x3400; ch <= 0x4db5; ch++)
		{
			getData(ch).setName("CJK UNIFIED IDEOGRAPH-" + getHexString(ch));
			getData(ch).setGC("Lo");
			debug_incrementGcCount("Lo");
			getData(ch).setCC(0);
		}
		for (int ch = 0x4e00; ch <= 0x9fbb; ch++)
		{
			getData(ch).setName("CJK UNIFIED IDEOGRAPH-" + getHexString(ch));
			getData(ch).setGC("Lo");
			debug_incrementGcCount("Lo");
			getData(ch).setCC(0);
		}
		for (int ch = 0x20000; ch <= 0x2a6d6; ch++)
		{
			getData(ch).setName("CJK UNIFIED IDEOGRAPH-" + getHexString(ch));
			getData(ch).setGC("Lo");
			debug_incrementGcCount("Lo");
			getData(ch).setCC(0);
		}
		
		for (int ch = 0xac00; ch <= 0xd7a3; ch++)
		{
			// compute hangul syllable name and decomposition as per UAX #15
			int SIndex = ch - SBase;
			int LIndex, VIndex, TIndex;

			if (SIndex < 0 || SIndex >= SCount)
				getData(ch).setName("HANGUL SYLLABLE WTF?");

			LIndex = SIndex / NCount;
			VIndex = (SIndex % NCount) / TCount;
			TIndex = SIndex % TCount;

			getData(ch).setNlColon(new Integer[] {LBase + LIndex, VBase + VIndex, TBase + TIndex});
			getData(ch).setName("HANGUL SYLLABLE " + JAMO_L_TABLE[LIndex] + JAMO_V_TABLE[VIndex] + JAMO_T_TABLE[TIndex]);
			// log.debug("U+" + getHexString(ch) + " " + getData(ch).getName() + " LIndex=" + LIndex + " VIndex=" + VIndex + " TIndex=" + TIndex);

			getData(ch).setGC("Lo");
			debug_incrementGcCount("Lo");
			getData(ch).setCC(0);
			
		}
		

	}

	private HashMap<String,Integer> debug_gcCounts;
	private void debug_incrementGcCount(String gc)
	{
		if (debug_gcCounts == null)
			debug_gcCounts = new HashMap<String,Integer>();

		Integer count = debug_gcCounts.get(gc);
		if (count != null)
			debug_gcCounts.put(gc, count+1);
		else
			debug_gcCounts.put(gc, 1);
	}
	private void debug_logGcCounts()
	{
		for (String gc: debug_gcCounts.keySet())
			log.debug(gc + ": " + debug_gcCounts.get(gc));
	}

	public static synchronized UnicodeInfo instance()
	{
		try
		{
			if (self == null)
				self = new UnicodeInfo();
		}
		catch (IOException e)
		{
			log.error("problem loading unicode data: " + e);
		}

		return self;
	}

	public int getViewCharCount(String view)
	{
		UnicodeSubset subset = getView(view);

		if (subset != null)
			return subset.getCount();
		else
			return 0;
	}

	/*
	 * <option name=';Z;'>Spacing Characters</option> 
	 * <option name='Inherited;Mn;'>Diacritical Marks</option> 
	 * <option name=';;1D100..1D1FF'>Musical Symbols</option>
	 * <option name=';;1D000..1D0FF,1D200..1D24F'>Archaic Musical Symbols</option>
	 * <option name=';Cc;'>Control Characters</option>
	 * <option name='Arabic;;'>Arabic</option>
	 *
	 * XXX the cache is vulnerable to denial of service attack -- hardcode list??
	 */
	private UnicodeSubset getView(String view)
	{
		log.debug("getting view " + view);
		String[] split = view.split(";", 4);
		if (split.length != 3)
		{
			log.error("invalid view, should be <script>;<category>;<range1>,<range2>,...");
			return null;
		}

		if (split[0].length() != 0 && split[1].length() == 0 && split[2].length() == 0)
		{
			log.debug("it's just a script, " + split[0]);
			return scripts.get(split[0]);
		}

		UnicodeSubset subset = viewCache.get(view);
		if (subset != null)
			return subset;

		subset = new UnicodeSubset(view);
		if (split[2].length() != 0)
		{
			String[] ranges = split[2].split(",");
			log.debug("got ranges to look at: " + Arrays.toString(ranges));
			for (String range: ranges)
			{
				String[] startFinish = range.split("\\.\\.", 3);
				int start, finish;

				if (startFinish.length != 2)
				{
					log.error("unable to parse range (should be like 0800..087F): " + range);
					return null;
				}

				try
				{
					start = Integer.parseInt(startFinish[0], 16);
					finish = Integer.parseInt(startFinish[1], 16);

					for (int ch = start; ch <= finish; ch++)
					{
						// log.debug("ch=0x" + UnicodeInfo.getHexString(ch) + " data.size()=" + data.size() + " split=" + Arrays.toString(split));
						CharInfo charInfo = data.get(ch);
						if (charInfo != null
								&& ("".equals(split[0]) || split[0].equals(charInfo.getScript()))
								&& (charInfo.getGC() != null && ("".equals(split[1]) || charInfo.getGC().startsWith(split[1]))))
							subset.addCharacter(ch);
					}
				}
				catch (NumberFormatException e)
				{
					log.error("unable to parse range (number format exception): " + range + " -- " + e);
				}
			}
		}
		else  
		{
			for (CharInfo detail: data.values())
			{
				// log.debug("detail.getCh()=" + getHexString(detail.getCh()) + " detail.getScript()=" + detail.getScript() + " detail.getGC()=" + detail.getGC());
				if ((split[0].length() == 0 || (detail.getScript() != null && split[0].equals(detail.getScript())))
							&& (split[1].length() == 0 || (detail.getGC() != null && detail.getGC().startsWith(split[1]))))
					subset.addCharacter(detail.getCh());
			}
		}

		viewCache.put(view, subset);
		return subset;
	}

	// confidence (0..1) -> result, sorted from most confident to least
	// XXX need to limit size of results!!
	public List<SearchResult> search(String query)
	{
		log.debug("searching for " + query);
		LinkedList<SearchResult> results = new LinkedList<SearchResult>();

		// XXX if jumping straight to character, doesn't actually search (should it?)
		if (query.charAt(0) > 0x7f && data.get(query.codePointAt(0)) != null)
		{
			CharInfo info = data.get(query.codePointAt(0));
			SearchResult result = new SearchResult(results.size(), query.codePointAt(0), info.getScript(), info.getScriptIndex(), info);
			results.add(result);
		}
		else
		{
			for (CharInfo info: data.values())
			{
				double matchLevel = info.matches(query);
				if (matchLevel > 0.000000001)
				{
					SearchResult result = new SearchResult(results.size(), info.getCh(), info.getScript() + ";;", info.getScriptIndex(), info);
					results.add(result);
				}
			}
		}

		return results;
	}

	public SearchResult search(int ch)
	{
		CharInfo info = data.get(ch);
		SearchResult result = new SearchResult(0, ch, info.getScript(), info.getScriptIndex(), info);
		return result;
	}

	/* includes characters referenced by details of listed characters */
	public Map<Integer,CharInfo> getDetails(String view, int i0, int count)
	{
		LinkedHashMap<Integer,CharInfo> results = new LinkedHashMap<Integer,CharInfo>();
		UnicodeSubset subset = getView(view);

		for (int i = i0; i < i0 + count; i++)
		{
			int ch = subset.getCharacter(i);
			if (ch == -1)
				break;

			CharInfo details = data.get(ch);
			if (details != null)
			{
				results.put(ch, details);
				if (details.getNlExes() != null)
					for (int refCh: details.getNlExes())
					{
						// log.debug("adding character to refdDetails: " + refCh);
						results.put(refCh, data.get(refCh));
					}
			}
			else
				results.put(ch, null);
		}

		return results;
	}

	public Collection<Integer> getCharacters(String view, int i0, int count)
	{
		UnicodeSubset subset = getView(view);
		if (subset != null)
			return subset.getCharacters(i0, count);
		else 
			return null;
	}

	public static void main(String[] args) throws Exception
	{
		log.debug(new Date());
		log.info("diaeresis results: " + instance().search("diaeresis"));
		log.debug(new Date());
	}

	public String[] getScriptNames() {
		String[] names = scripts.keySet().toArray(new String[0]);
		Arrays.sort(names);
		return names;
	}
}
