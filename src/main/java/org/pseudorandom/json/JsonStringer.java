package org.pseudorandom.json;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Collection;
import java.util.Map;
import java.util.Map.Entry;
import java.util.List;
import org.apache.log4j.Logger;

public class JsonStringer
{
	private static Logger log = Logger.getLogger(JsonStringer.class);

	public static String toJson(Object obj)
	{
		// log.debug("converting " + obj + " to json");
		if (obj == null)
		{
			return "false"; // javascript null
		}
		else if (obj instanceof Number)
		{
			return obj.toString();
		}
		else if (obj instanceof CharSequence || obj instanceof Character)
		{
			return "'" + obj.toString().replace("'", "\\'") + "'";
		}
		else if (obj instanceof Collection)
		{
			StringBuffer buf = new StringBuffer("[");
			int i = 0;
			for (Object o: (Collection) obj)
			{
				if (i != 0)
					buf.append(",");
				buf.append(toJson(o));
				i++;
			}
			buf.append("]");
			return buf.toString();
		}
		else if (obj instanceof Object[])
		{
			StringBuffer buf = new StringBuffer("[");
			Object[] arr = (Object[]) obj;
			for (int i = 0; i < arr.length; i++)
			{
				if (i != 0)
					buf.append(",");
				buf.append(toJson(arr[i]));
			}
			buf.append("]");
			return buf.toString();
		}
		else if (obj instanceof Map)
		{
			StringBuffer buf = new StringBuffer("{");
			Map map = (Map) obj;
			Object[] keys = map.keySet().toArray();
			for (int i = 0; i < keys.length; i++)
			{
				String jsonKey = keys[i].toString();
				String jsonValue = toJson(map.get(keys[i]));
				if (i != 0)
					buf.append(',');
				buf.append(jsonKey).append(':').append(jsonValue);
			}
			buf.append('}');
			return buf.toString();
		}
		else
		{
			try
			{
				StringBuffer buf = new StringBuffer("{");
				int count = 0;

				for (Field field: obj.getClass().getDeclaredFields())
					if (!Modifier.isStatic(field.getModifiers()))
					{
						if (!field.getName().startsWith("this"))
						{
							field.setAccessible(true);
							String jsonKey = field.getName();
							String jsonValue = toJson(field.get(obj));
							if (count != 0)
								buf.append(",");
							buf.append(jsonKey).append(":").append(jsonValue);
							count++;
						}
						else
							log.debug("skipping field: " + field);
					}
				buf.append("}");
				return buf.toString();
			}
			catch (IllegalArgumentException e)
			{
				log.error("illegal argument exception creating json from " + obj + ": " + e);
				return "'[illegal argument exception creating json from " + obj + ": " + e + "]'";
			}
			catch (IllegalAccessException e) 
			{
				log.error("illegal access exception creating json from " + obj + ": " + e);
				return "'[illegal access exception creating json from " + obj + ": " + e + "]'";
			}
		}
	}
}
