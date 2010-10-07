package org.pseudorandom.unicode;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.pseudorandom.json.JsonStringer;

public class DetailsService extends HttpServlet
{
	private static final long serialVersionUID = 1L;

	private static Logger log = Logger.getLogger(DetailsService.class);

	private class ResponseObject 
	{ 
		int viewCharCount; 
		Collection<Integer> characters;
		Map<Integer,CharInfo> details;

		ResponseObject(int viewCharCount, Collection<Integer> characters, Map<Integer,CharInfo> details)
		{ 
			this.viewCharCount = viewCharCount; 
			this.characters = characters; 
			this.details = details; 
		}
	}

	private UnicodeInfo unicodeInfo;

	public void init() throws ServletException
	{
		log.debug("init");
		unicodeInfo = UnicodeInfo.getInstance();
	}

	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doGet(request, response);
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		log.debug("handling request " + request.getRequestURI() + "?" + request.getQueryString());

		final String view = request.getParameter("view").trim();
		final int i0 = Integer.parseInt(request.getParameter("i0").trim());
		final int count = Integer.parseInt(request.getParameter("count").trim());

		ResponseObject responseObject = new ResponseObject(unicodeInfo.getViewCharCount(view), unicodeInfo.getCharacters(view, i0, count), unicodeInfo.getDetails(view, i0, count));

		log.debug("responseObject.viewCharCount=" + responseObject.viewCharCount + " i0=" + i0 + " responseObject.details.size()=" + responseObject.details.size() + ((i0 + responseObject.details.size() > responseObject.viewCharCount) ? " WTF???" : ""));

		response.setContentType("text/javascript"); // ;charset=utf-8");
		response.setCharacterEncoding("utf-8");

		String json = JsonStringer.toJson(responseObject);

		response.getWriter().println(json);
		log.debug("wrote json: " + (json.length() >= 100 ? json.substring(0,100) : json) + " ...");
	}
}

