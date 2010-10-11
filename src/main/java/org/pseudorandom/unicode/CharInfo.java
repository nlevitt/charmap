package org.pseudorandom.unicode;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;

// bean for json-ification
public class CharInfo  
{
	private static Logger log = Logger.getLogger(CharInfo.class);

	private int ch = -1;
	private String name = null;
	private Set<String> eq = null;
	private Set<Integer> ex = null;
	private Set<String> strz = null;
	private String gc = null;
	private int cc = -1;
	private String script; 
	private int scriptIndex;
	private Map<String,String> han;

	private String lbs = null;
	private Integer[] lbcs = null;

	private Integer[] colon = null;

	public void addHan(String prop, String value)
	{
		if (han == null)
			han = new LinkedHashMap<String,String>();

		han.put(prop, value);
	}

	public void setScript(String script)
	{
		this.script = script;
	}

	public void setScriptIndex(int scriptIndex)
	{
		this.scriptIndex = scriptIndex;
	}

	public int getScriptIndex()
	{
		return scriptIndex;
	}

	public String getScript()
	{
		return script;
	}

	public void setGC(String gc)
	{
		this.gc = gc;
	}

	public String getGC()
	{
		return this.gc;
	}

	public void setCC(int cc)
	{
		this.cc = cc;
	}

	public String getName()
	{
		return name;
	}

	public Set<Integer> getNlExes()
	{
		return ex;
	}

	public CharInfo(int ch)
	{
		this.ch = ch;
	}

	public void setName(String name)
	{
		this.name = name;
	}

	public void addNlEqual(String value)
	{
		if (eq == null)
			eq = new LinkedHashSet<String>(1);
		
		eq.add(value);
	}

	public void addNlStar(String value)
	{
		if (strz == null)
			strz = new LinkedHashSet<String>(1);
		
		strz.add(value);
	}

	public void addNlEx(int value)
	{
		if (ex == null)
			ex = new LinkedHashSet<Integer>(1);
		
		ex.add(value);
	}

	public void setNlPound(String str, Integer[] chs)
	{
		this.lbs = str;
		this.lbcs = chs;
		// log.debug("set lbs="+str + " lbcs="+lbcs);
	}

	public void setNlColon(Integer[] value)
	{
		colon = value;
	}

	public int getCh()
	{
		return ch;
	}

	public String toString()
	{
		return "U+" + UnicodeInfo.getHexString(ch) + " " + name;
	}

	public double matches(String query)
	{
		Pattern queryRegex = Pattern.compile(Pattern.quote(query), Pattern.CASE_INSENSITIVE);

		if (name != null && queryRegex.matcher(name).find())
			return 0.600;

		if (eq != null)
			for (String str: eq)
				if (queryRegex.matcher(str).find())
					return 0.400;
		if (strz != null)
			for (String str: strz)
				if (queryRegex.matcher(str).find())
					return 0.400;

		return 0;
	}

	public int getCC() {
		return cc;
	}
	
}
