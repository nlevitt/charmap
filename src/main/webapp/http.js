/*
 * Each instance of Http handles one request at a time. If a new request is
 * sent with http.request() while one is in progress, the request in progress
 * is canceled (the response is ignored), and the new request is sent. To do
 * simultaneous requests, create multiple instances of Http.
 */
function Http(responseHandler)
{
	var xmlhttp = false;
	var url = false;

	// credit: http://jibbering.com/2002/4/httprequest.html 
	// probs not all needed in 2007
	var newXmlHttp = function()
	{
		var xh;

		/*@cc_on @*/
		/*@if (@_jscript_version >= 5)
		// JScript gives us Conditional compilation, we can cope with old IE versions.
		// and security blocked creation of the objects.
		try 
		{
			xh = new ActiveXObject("Msxml2.XMLHTTP");
		} 
		catch (e) 
		{
			try 
			{
				xh = new ActiveXObject("Microsoft.XMLHTTP");
			} 
			catch (E) 
			{
				xh = false;
			}
		}
		@end @*/
		if (!xh && typeof XMLHttpRequest !='undefined') 
		{
			try {
				xh = new XMLHttpRequest();
			} catch (e) {
				xh = false;
			}
		}
		if (!xh && window.createRequest) {
			try {
				xh = window.createRequest();
			} catch (e) {
				xh = false;
			}
		}

		return xh;
	};

	var handleReadyStateChange = function(event) 
	{
		if (xmlhttp.readyState == 4) 
		{
			log('xmlhttp url=' + url + ' readyState=' + xmlhttp.readyState + ' status=' + xmlhttp.status);
			if (xmlhttp.status == 200)
				responseHandler(xmlhttp.responseText);
			else
				window.alert('http request failed readyState=' + xmlhttp.readyState + ' status=' + xmlhttp.status + ' statusText="' + xmlhttp.statusText + '"');

			xmlhttp.onreadystatechange = function(event) {};
			xmlhttp = false;
		}
	};

	this.request = function(loc)
	{ 
		if (xmlhttp)
		{
			xmlhttp.onreadystatechange = function(event) {};
			xmlhttp = false;
			log('canceled request to ' + url + ' to make new request to ' + loc);
		}

		url = loc;
		xmlhttp = newXmlHttp();

		xmlhttp.open('get', url, true);

		xmlhttp.onreadystatechange = handleReadyStateChange;

		try
		{
			xmlhttp.send(null);
		}
		catch (e)
		{
			log('WARNING xmlhttp.send() threw exception: ' + e);
			alert('xmlhttp.send() threw exception: ' + e);
		}	
	};

	this.setResponseHandler = function(handler)
	{
		responseHandler = handler;
	};
}
