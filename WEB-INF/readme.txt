javac -classpath "/usr/share/tomcat6/webapps/charmap.org/ROOT/WEB-INF/classes:/usr/share/java/servlet.jar:/usr/share/java/log4j.jar" /usr/share/tomcat6/webapps/charmap.org/ROOT/WEB-INF/classes/org/pseudorandom/*/*.java && sudo /etc/init.d/tomcat6 restart && tail -f /var/log/tomcat6/catalina.out

