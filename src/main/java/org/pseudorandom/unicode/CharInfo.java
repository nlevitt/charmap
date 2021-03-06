package org.pseudorandom.unicode;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

// bean for json-ification
public class CharInfo {
	// private static Logger log = Logger.getLogger(CharInfo.class);

	protected int ch = -1;
	protected String name = null;
	protected Set<String> eq = null;
	protected Set<Integer> ex = null;
	protected Set<String> strz = null;
	protected String gc = null;
	protected int cc = -1;
	protected String script;
	protected int scriptIndex;
	protected Map<String, String> han;
	protected String block;
	protected int blockIndex;
	protected String lbs = null;
	protected Integer[] lbcs = null;
	protected Integer[] colon = null;

	public void setHanProperty(String prop, String value) {
		if (han == null) {
			han = new LinkedHashMap<String, String>();
		}

		han.put(prop, value);
	}

	public String getHanProperty(String prop) {
		if (han != null) {
			return han.get(prop);
		} else {
			return null;
		}
	}

	public void setScript(String script) {
		this.script = script;
	}

	public void setScriptIndex(int scriptIndex) {
		this.scriptIndex = scriptIndex;
	}

	public int getScriptIndex() {
		return scriptIndex;
	}

	public String getScript() {
		return script;
	}

	public void setGC(String gc) {
		this.gc = gc;
	}

	public String getGC() {
		return this.gc;
	}

	public void setCC(int cc) {
		this.cc = cc;
	}

	public String getName() {
		return name;
	}

	public Set<Integer> getNlExes() {
		return ex;
	}

	public CharInfo(int ch) {
		this.ch = ch;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void addNlEqual(String value) {
		if (eq == null)
			eq = new LinkedHashSet<String>(1);

		eq.add(value);
	}

	public void addNlStar(String value) {
		if (strz == null)
			strz = new LinkedHashSet<String>(1);

		strz.add(value);
	}

	public void addNlEx(int value) {
		if (ex == null)
			ex = new LinkedHashSet<Integer>(1);

		ex.add(value);
	}

	public void setNlPound(String str, Integer[] chs) {
		this.lbs = str;
		this.lbcs = chs;
		// log.debug("set lbs="+str + " lbcs="+lbcs);
	}

	public void setNlColon(Integer[] value) {
		colon = value;
	}

	public int getCh() {
		return ch;
	}

	public String toString() {
		return "U+" + UnicodeInfo.getHexString(ch) + " " + name;
	}

	public double matches(String query) {
		Pattern queryRegex = Pattern.compile(Pattern.quote(query), Pattern.CASE_INSENSITIVE);

		if (name != null && queryRegex.matcher(name).find()) {
			return 0.600;
		}

		if (eq != null) {
			for (String str : eq) {
				if (queryRegex.matcher(str).find()) {
					return 0.400;
				}
			}
		}
		
		if (strz != null) {
			for (String str : strz) {
				if (queryRegex.matcher(str).find()) {
					return 0.400;
				}
			}
		}

		if (getHanProperty("kDefinition") != null) {
			if (queryRegex.matcher(getHanProperty("kDefinition")).find()) {
				return 0.300;
			}
		}

		return 0;
	}

	public int getCC() {
		return cc;
	}

	public void setBlock(String block) {
		this.block = block;
	}

	public void setBlockIndex(int blockIndex) {
		this.blockIndex = blockIndex;
	}

}
