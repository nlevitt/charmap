package org.pseudorandom.unicode;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Arrays;
import java.util.List;
import java.util.LinkedList;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.SortedMap;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.ServletException;
import org.apache.log4j.Logger;
import org.pseudorandom.json.JsonStringer;

public class SearchService extends HttpServlet
{
	private static Logger log = Logger.getLogger(SearchService.class);

	private UnicodeInfo unic;
	private LinkedHashMap<String,List<SearchResult>> cache;

	public void init() throws ServletException
	{
		log.debug("SearchService.init()");
		unic = UnicodeInfo.getInstance();
		cache = new LinkedHashMap<String,List<SearchResult>>();
	}

	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doGet(request, response);
	}

	private class ResponseObject
	{
		private int count;
		private SearchResult result;

		ResponseObject(int count, SearchResult result)
		{
			this.count = count;
			this.result = result;
		}

		public String toString()
		{
			return "ResponseObject(count=" + count + ",result=" + result +")";
		}
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		log.debug("handling request " + request.getRequestURI() + "?" + request.getQueryString());
		List<SearchResult> results = null;

		if (request.getParameter("ch") != null)
		{
			int ch = Integer.parseInt(request.getParameter("ch"));
			log.debug("getting character ch=" + ch);
			results = new LinkedList<SearchResult>();
			results.add(unic.search(ch));
		}
		else if (request.getParameter("q") != null)
		{
			String query = request.getParameter("q").trim();
				results = cache.get(query);

			if (results == null)
			{
				results = unic.search(query);
				log.debug("q=" + query + " not found in cache results: " + (results.toString().length() >= 400 ? results.toString().substring(0,400) : results.toString()) + " ...");
				cache.put(query, results);
			}
			else
				log.debug("q=" + query + " found in cache results: " + (results.toString().length() >= 400 ? results.toString().substring(0,400) : results.toString()) + " ...");
		}

		ResponseObject rObj;
		if (results.size() > 1)
		{
			int ch0 = Integer.parseInt(request.getParameter("ch0"));
			SearchResult result = findNext(results, request.getParameter("view"), ch0);
			rObj = new ResponseObject(results.size(), result);
		}
		else if (results.size() == 1)
		{
			rObj = new ResponseObject(1, results.get(0));
		}
		else
			rObj = new ResponseObject(0, null);

		log.debug("writing json for " + (rObj.toString().length() >= 400 ? rObj.toString().substring(0,400) : rObj.toString()) + " ...");

                response.setContentType("text/javascript"); // ;charset=utf-8");
                response.setCharacterEncoding("UTF-8");
		
		String json = JsonStringer.toJson(rObj);

		response.getWriter().println(json);
		log.debug("wrote json: " + (json.toString().length() >= 400 ? json.toString().substring(0,400) : json.toString()) + " ...");
	}

	// XXX inefficient linear search
	private SearchResult findNext(List<SearchResult> results, String view, int ch0)
	{
		log.debug("results.size()=" + results.size() + " view=" + view + " ch0=" + ch0);
		boolean nextOne = false;

		for (SearchResult result: results)
		{
			log.debug("view=" + view + " result.ch=" + result.ch + " result.view=" + result.view + " result.i=" + result.i + " ch0=" + ch0);

			// ch0 the last one, so it's this one )
			if (nextOne)
			{
				log.debug("nextOne is true -- returning result.ch=" + result.ch);
				return result;
			}
			// search result is in current view and after ch0
			else if (result.view.equals(view) && result.ch > ch0)
			{
				log.debug("result.view.equals(lastView) && result.ch > ch0 -- returning result.ch=" + result.ch);
				return result;
			}
			else if (result.ch == ch0)
				nextOne = true;
		}

		log.debug("returning first result result.ch=" + results.get(0).ch);
		return results.get(0);
	}
}
