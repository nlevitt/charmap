package org.pseudorandom.charmap;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.pseudorandom.unicode.UnicodeInfo;

public class CharmapUIServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		req.setAttribute("unicodeInfo", UnicodeInfo.instance());
		req.getRequestDispatcher("/ui.jspx").forward(req, resp);
	}

}
