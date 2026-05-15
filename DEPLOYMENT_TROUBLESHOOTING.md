# PSI Probe Deployment Troubleshooting Guide

## 🔴 Current Issue: Quartz Scheduler ClassLoader Error

### Error Symptoms
```
java.lang.IllegalStateException: Illegal access: this web application instance has been stopped already
Exception in thread "Probe_Quartz-1" java.lang.NoClassDefFoundError: ch/qos/logback/core/status/WarnStatus
```

### Root Cause
The application is starting but immediately becoming unavailable, causing Quartz scheduler threads to fail when trying to access classes after the webapp context has been stopped.

---

## 🔧 Solution Steps

### Step 1: Configure Tomcat Users
PSI Probe requires specific security roles. Edit `$TOMCAT_HOME/conf/tomcat-users.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tomcat-users xmlns="http://tomcat.apache.org/xml"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
              version="1.0">
  
  <!-- Define roles required by PSI Probe -->
  <role rolename="manager-gui"/>
  <role rolename="manager"/>
  <role rolename="probeuser"/>
  <role rolename="poweruser"/>
  <role rolename="poweruserplus"/>
  
  <!-- Create a user with all required roles -->
  <user username="admin" 
        password="admin" 
        roles="manager-gui,manager,probeuser,poweruser,poweruserplus"/>
  
  <!-- Or create separate users for different access levels -->
  <user username="probe" 
        password="probe123" 
        roles="probeuser"/>
  
  <user username="power" 
        password="power123" 
        roles="poweruser,poweruserplus"/>
</tomcat-users>
```

**⚠️ IMPORTANT:** Change the passwords in production!

---

### Step 2: Fix HTTPS Requirement

PSI Probe's `web.xml` requires HTTPS (`CONFIDENTIAL` transport). You have 3 options:

#### Option A: Configure HTTPS Connector (Recommended for Production)

Edit `$TOMCAT_HOME/conf/server.xml` and add/uncomment the HTTPS connector:

```xml
<Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
           maxThreads="150" SSLEnabled="true">
    <SSLHostConfig>
        <Certificate certificateKeystoreFile="conf/localhost-rsa.jks"
                     type="RSA" />
    </SSLHostConfig>
</Connector>
```

Generate a self-signed certificate for testing:
```bash
keytool -genkey -alias tomcat -keyalg RSA -keystore $TOMCAT_HOME/conf/localhost-rsa.jks
```

Access PSI Probe at: `https://localhost:8443/probe/`

#### Option B: Disable HTTPS Requirement (Development Only)

Edit `psi-probe-web/src/main/webapp/WEB-INF/web.xml` and remove or comment out:

```xml
<!-- REMOVE OR COMMENT THIS SECTION -->
<!--
<user-data-constraint>
    <transport-guarantee>CONFIDENTIAL</transport-guarantee>
</user-data-constraint>
-->
```

Then rebuild:
```bash
mvnw clean package
```

Access PSI Probe at: `http://localhost:8080/probe/`

#### Option C: Use HTTP Connector with Security Disabled (Testing Only)

If you just want to test quickly, modify `web.xml` to change `CONFIDENTIAL` to `NONE`:

```xml
<user-data-constraint>
    <transport-guarantee>NONE</transport-guarantee>
</user-data-constraint>
```

---

### Step 3: Verify Tomcat Configuration

Check that your Tomcat `server.xml` has the connectors you saw in the logs:

```xml
<!-- HTTP Connector on port 9092 -->
<Connector port="9092" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="9443" />

<!-- HTTP Connector on port 9081 -->
<Connector port="9081" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="9443" />

<!-- HTTPS Connector (if using Option A above) -->
<Connector port="9443" protocol="org.apache.coyote.http11.Http11NioProtocol"
           maxThreads="150" SSLEnabled="true">
    <SSLHostConfig>
        <Certificate certificateKeystoreFile="conf/localhost-rsa.jks"
                     type="RSA" />
    </SSLHostConfig>
</Connector>
```

---

### Step 4: Deploy and Test

1. **Stop Tomcat:**
   ```bash
   $TOMCAT_HOME/bin/shutdown.sh
   # or on Windows:
   %TOMCAT_HOME%\bin\shutdown.bat
   ```

2. **Remove old deployment:**
   ```bash
   rm -rf $TOMCAT_HOME/webapps/probe*
   ```

3. **Copy new WAR:**
   ```bash
   cp psi-probe-web/target/probe.war $TOMCAT_HOME/webapps/
   ```

4. **Start Tomcat:**
   ```bash
   $TOMCAT_HOME/bin/startup.sh
   # or on Windows:
   %TOMCAT_HOME%\bin\startup.bat
   ```

5. **Check logs:**
   ```bash
   tail -f $TOMCAT_HOME/logs/catalina.out
   ```

6. **Access PSI Probe:**
   - With HTTPS: `https://localhost:9443/probe/`
   - Without HTTPS: `http://localhost:9092/probe/`
   - Login with credentials from Step 1

---

## 🔍 Verification Checklist

- [ ] Tomcat users configured with required roles
- [ ] HTTPS connector configured OR HTTPS requirement removed
- [ ] WAR file deployed to webapps directory
- [ ] Tomcat started successfully
- [ ] No "Illegal access" errors in logs
- [ ] Can access `/probe/` URL
- [ ] Can login with configured credentials
- [ ] Dashboard loads at `/probe/dashboard.htm`

---

## 🐛 Common Issues

### Issue 1: "403 Forbidden"
**Cause:** User doesn't have required roles  
**Solution:** Add user to `manager-gui`, `probeuser`, or `poweruser` roles

### Issue 2: "Connection Refused"
**Cause:** Trying HTTP when HTTPS is required  
**Solution:** Use `https://` URL or disable HTTPS requirement

### Issue 3: "Illegal access: webapp stopped"
**Cause:** App is shutting down immediately after startup  
**Solution:** Fix authentication/HTTPS issues above

### Issue 4: "404 Not Found"
**Cause:** WAR not deployed or wrong context path  
**Solution:** Verify `probe.war` is in `webapps/` directory

### Issue 5: Quartz Threads Still Failing
**Cause:** Webapp context destroyed before scheduler shutdown  
**Solution:** Ensure app stays running (fix auth/HTTPS first)

---

## 📊 Expected Successful Startup Log

```
INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deploying web application archive [probe.war]
INFO [main] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext initialized
INFO [main] org.quartz.core.QuartzScheduler.start Scheduler ProbeScheduler started
INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deployment of web application archive [probe.war] has finished
INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-nio-9092"]
INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [18950] milliseconds
```

**No errors after this point!**

---

## 🚀 Quick Fix for Development

If you just want to get it working quickly for development:

1. **Edit web.xml** - Change `CONFIDENTIAL` to `NONE`
2. **Add Tomcat user:**
   ```xml
   <user username="admin" password="admin" roles="manager-gui,probeuser,poweruser"/>
   ```
3. **Rebuild and deploy:**
   ```bash
   mvnw clean package
   cp psi-probe-web/target/probe.war $TOMCAT_HOME/webapps/
   ```
4. **Restart Tomcat**
5. **Access:** `http://localhost:9092/probe/`
6. **Login:** admin / admin

---

## 📞 Still Having Issues?

Check these logs for more details:
- `$TOMCAT_HOME/logs/catalina.out` - Main Tomcat log
- `$TOMCAT_HOME/logs/localhost.*.log` - Host-specific logs
- `$TOMCAT_HOME/logs/probe.log` - PSI Probe application log (if created)

Look for:
- Authentication failures
- SSL/TLS errors
- Spring context initialization errors
- Database connection errors (if using datasources)

---

**Last Updated:** 2026-05-15  
**Version:** 5.3.1-SNAPSHOT
