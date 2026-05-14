# Jenkins Setup Guide for PSI Probe

## 📋 Prerequisites

- Jenkins installed and running
- Java 17+ installed on Jenkins server
- Maven 3.9.11+ installed on Jenkins server
- Git installed on Jenkins server

---

## 🔐 Step 1: Create GitHub Credentials in Jenkins

### Option A: Using Username & Password (or Personal Access Token)

1. **Go to Jenkins Credentials:**
   ```
   Jenkins → Manage Jenkins → Manage Credentials
   ```

2. **Add New Credentials:**
   - Click on `(global)` domain
   - Click `Add Credentials`

3. **Fill in the form:**
   ```
   Kind: Username with password
   Scope: Global
   Username: imthiyas63
   Password: [Your GitHub Personal Access Token]
   ID: jenkins-build
   Description: GitHub credentials for probe repository
   ```

4. **Click `Create`**

### Option B: Using SSH Key

1. **Generate SSH Key (if not exists):**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "jenkins@yourserver.com"
   # Save to: /var/lib/jenkins/.ssh/id_rsa
   ```

2. **Add Public Key to GitHub:**
   - Copy public key: `cat ~/.ssh/id_rsa.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the public key

3. **Add Private Key to Jenkins:**
   ```
   Jenkins → Manage Jenkins → Manage Credentials
   Kind: SSH Username with private key
   ID: jenkins-build
   Username: git
   Private Key: [Paste private key content]
   ```

### How to Create GitHub Personal Access Token:

1. **Go to GitHub:**
   ```
   https://github.com/settings/tokens
   ```

2. **Generate new token (classic):**
   - Click `Generate new token` → `Generate new token (classic)`
   - Note: `Jenkins build token`
   - Expiration: `No expiration` (or set as needed)
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `read:org` (Read org and team membership)

3. **Copy the token** (you won't see it again!)

4. **Use this token as password in Jenkins credentials**

---

## 🔧 Step 2: Create Jenkins Pipeline Job

### Method 1: Pipeline from SCM (Recommended)

1. **Create New Job:**
   ```
   Jenkins → New Item
   Name: psi-probe-build
   Type: Pipeline
   Click OK
   ```

2. **Configure General Settings:**
   ```
   Description: PSI Probe build pipeline
   ✅ Discard old builds
      Days to keep builds: 30
      Max # of builds to keep: 10
   ```

3. **Configure Pipeline:**
   ```
   Definition: Pipeline script from SCM
   
   SCM: Git
   
   Repository URL: https://github.com/imthiyas63/probe.git
   
   Credentials: jenkins-build (GitHub credentials)
   
   Branches to build: */master
   
   Script Path: Jenkinsfile
   
   ✅ Lightweight checkout
   ```

4. **Click `Save`**

### Method 2: Multibranch Pipeline

1. **Create New Job:**
   ```
   Jenkins → New Item
   Name: psi-probe
   Type: Multibranch Pipeline
   Click OK
   ```

2. **Configure Branch Sources:**
   ```
   Add source → Git
   
   Project Repository: https://github.com/imthiyas63/probe.git
   
   Credentials: jenkins-build
   
   Behaviors:
   - Discover branches
   - Discover tags
   ```

3. **Build Configuration:**
   ```
   Mode: by Jenkinsfile
   Script Path: Jenkinsfile
   ```

4. **Scan Multibranch Pipeline Triggers:**
   ```
   ✅ Periodically if not otherwise run
   Interval: 1 hour
   ```

5. **Click `Save`**

---

## 🚀 Step 3: Configure Jenkins Environment

### Update Java Path (if needed)

1. **Check Java installation:**
   ```bash
   which java
   # Output: /usr/lib/jvm/java-17-amazon-corretto/bin/java
   ```

2. **Update Jenkinsfile if path is different:**
   ```groovy
   environment {
       JAVA_HOME = '/your/actual/java/path'
   }
   ```

### Update Maven Path (if needed)

1. **Check Maven installation:**
   ```bash
   which mvn
   # Output: /usr/app/maven/maven-3.9.11/bin/mvn
   ```

2. **Update Jenkinsfile if path is different:**
   ```groovy
   environment {
       MAVEN_HOME = '/your/actual/maven/path'
   }
   ```

### Configure Global Tools (Alternative Method)

Instead of hardcoding paths, use Jenkins Global Tool Configuration:

1. **Go to:**
   ```
   Jenkins → Manage Jenkins → Global Tool Configuration
   ```

2. **Configure JDK:**
   ```
   JDK installations:
   Name: Java 17
   JAVA_HOME: /usr/lib/jvm/java-17-amazon-corretto
   ✅ Install automatically (optional)
   ```

3. **Configure Maven:**
   ```
   Maven installations:
   Name: Maven 3.9.11
   MAVEN_HOME: /usr/app/maven/maven-3.9.11
   ✅ Install automatically (optional)
   ```

4. **Update Jenkinsfile to use tools:**
   ```groovy
   pipeline {
       agent any
       
       tools {
           jdk 'Java 17'
           maven 'Maven 3.9.11'
       }
       
       // ... rest of pipeline
   }
   ```

---

## ▶️ Step 4: Run Your First Build

1. **Trigger Build:**
   ```
   Jenkins → psi-probe-build → Build Now
   ```

2. **Monitor Build:**
   - Click on build number (e.g., #1)
   - Click `Console Output` to see logs

3. **Expected Output:**
   ```
   Started by user admin
   Checking out https://github.com/imthiyas63/probe.git
   Building PSI Probe...
   [INFO] BUILD SUCCESS
   Archiving artifacts
   Finished: SUCCESS
   ```

4. **Download Artifact:**
   ```
   Build #1 → Artifacts → probe.war
   ```

---

## 🔍 Step 5: Verify Build

### Check Build Status:
```
✅ Checkout stage: SUCCESS
✅ Build stage: SUCCESS
✅ Archive stage: SUCCESS
✅ Artifact: probe.war (available for download)
```

### Download and Verify Artifact:
```bash
# Download from Jenkins
wget http://jenkins-server/job/psi-probe-build/lastSuccessfulBuild/artifact/psi-probe-web/target/probe.war

# Verify it's a valid WAR file
unzip -l probe.war | head -20

# Check size (should be ~30-40 MB)
ls -lh probe.war
```

---

## 🔄 Step 6: Enable Automatic Builds

### Option 1: Poll SCM (Check for changes)

1. **Edit Job Configuration:**
   ```
   Build Triggers:
   ✅ Poll SCM
   Schedule: H/5 * * * *
   ```
   This checks GitHub every 5 minutes for changes.

2. **Update Jenkinsfile (optional):**
   ```groovy
   triggers {
       pollSCM('H/5 * * * *')
   }
   ```

### Option 2: GitHub Webhook (Instant builds)

1. **Install GitHub Plugin in Jenkins:**
   ```
   Manage Jenkins → Manage Plugins → Available
   Search: GitHub Integration Plugin
   Install and restart
   ```

2. **Configure GitHub Webhook:**
   ```
   GitHub Repository → Settings → Webhooks → Add webhook
   
   Payload URL: http://jenkins-server/github-webhook/
   Content type: application/json
   Events: Just the push event
   ✅ Active
   ```

3. **Enable in Jenkins Job:**
   ```
   Build Triggers:
   ✅ GitHub hook trigger for GITScm polling
   ```

---

## 📊 Step 7: View Build History & Artifacts

### Build History:
```
Jenkins → psi-probe-build → Build History
```

### Download Artifacts:
```
# Latest successful build
http://jenkins-server/job/psi-probe-build/lastSuccessfulBuild/artifact/

# Specific build
http://jenkins-server/job/psi-probe-build/42/artifact/

# Direct WAR download
http://jenkins-server/job/psi-probe-build/lastSuccessfulBuild/artifact/psi-probe-web/target/probe.war
```

---

## 🐛 Troubleshooting

### Issue 1: "Credentials not found"

**Error:**
```
ERROR: Could not find credentials entry with ID 'jenkins-build'
```

**Solution:**
1. Verify credential ID matches exactly: `jenkins-build`
2. Check credential scope is `Global`
3. Recreate credential if needed

### Issue 2: "Permission denied (publickey)"

**Error:**
```
Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Solution:**
1. Use HTTPS URL instead of SSH: `https://github.com/imthiyas63/probe.git`
2. Or add SSH key to GitHub (see Step 1, Option B)

### Issue 3: "Java not found"

**Error:**
```
java: command not found
```

**Solution:**
```bash
# Find Java installation
find /usr -name java 2>/dev/null

# Update JAVA_HOME in Jenkinsfile
JAVA_HOME = '/path/to/java'
```

### Issue 4: "Maven not found"

**Error:**
```
mvn: command not found
```

**Solution:**
```bash
# Find Maven installation
find /usr -name mvn 2>/dev/null

# Update MAVEN_HOME in Jenkinsfile
MAVEN_HOME = '/path/to/maven'
```

### Issue 5: "Build fails with 401 Unauthorized"

**Error:**
```
remote: HTTP Basic: Access denied
fatal: Authentication failed
```

**Solution:**
1. Regenerate GitHub Personal Access Token
2. Update Jenkins credentials with new token
3. Ensure token has `repo` scope

### Issue 6: "Out of memory during build"

**Error:**
```
java.lang.OutOfMemoryError: Java heap space
```

**Solution:**
Add to Jenkinsfile:
```groovy
environment {
    MAVEN_OPTS = '-Xmx4096m -XX:MaxPermSize=1024m'
}
```

---

## 📧 Step 8: Configure Notifications (Optional)

### Email Notifications:

1. **Install Email Extension Plugin:**
   ```
   Manage Jenkins → Manage Plugins → Email Extension Plugin
   ```

2. **Configure SMTP:**
   ```
   Manage Jenkins → Configure System → Extended E-mail Notification
   SMTP server: smtp.gmail.com
   SMTP Port: 587
   Credentials: [Add email credentials]
   ```

3. **Add to Jenkinsfile:**
   ```groovy
   post {
       success {
           emailext(
               subject: "✅ Build #${env.BUILD_NUMBER} - SUCCESS",
               body: "Download: ${env.BUILD_URL}artifact/",
               to: 'team@example.com'
           )
       }
       failure {
           emailext(
               subject: "❌ Build #${env.BUILD_NUMBER} - FAILED",
               body: "Check logs: ${env.BUILD_URL}console",
               to: 'team@example.com'
           )
       }
   }
   ```

### Slack Notifications:

1. **Install Slack Notification Plugin**

2. **Configure Slack:**
   ```
   Manage Jenkins → Configure System → Slack
   Workspace: your-workspace
   Credential: [Slack token]
   Default channel: #builds
   ```

3. **Add to Jenkinsfile:**
   ```groovy
   post {
       success {
           slackSend(
               color: 'good',
               message: "Build #${env.BUILD_NUMBER} succeeded"
           )
       }
   }
   ```

---

## 📝 Complete Jenkinsfile with Credentials

```groovy
pipeline {
    agent any
    
    options {
        timestamps()
    }
    
    environment {
        JAVA_HOME  = '/usr/lib/jvm/java-17-amazon-corretto'
        PATH       = "${JAVA_HOME}/bin:${env.PATH}"
        MAVEN_HOME = '/usr/app/maven/maven-3.9.11'
        MAVEN_CMD  = "${MAVEN_HOME}/bin/mvn"
        MAVEN_REPO = "/usr/app/maven/repository"
    }
    
    stages {
        
        stage('Checkout') {
            steps {
                git branch: 'master',
                    credentialsId: 'jenkins-build',
                    url: 'https://github.com/imthiyas63/probe.git'
            }
        }
        
        stage('Build') {
            steps {
                sh """
                    ${MAVEN_CMD} clean package \
                        -Dmaven.repo.local=${MAVEN_REPO} \
                        -Dbuild.version=${env.BUILD_NUMBER} \
                        -Dbuild.branch=${env.BRANCH_NAME} \
                        -DskipTests=true \
                        -B
                """
            }
        }
        
        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'psi-probe-web/target/probe.war', fingerprint: true
            }
        }
        
    }
    
    post {
        always {
            echo "Build finished for branch ${env.BRANCH_NAME}"
        }
    }
}
```

---

## ✅ Checklist

Before running your first build, verify:

- [ ] Jenkins is running
- [ ] Java 17+ is installed
- [ ] Maven 3.9.11+ is installed
- [ ] Git is installed
- [ ] GitHub credentials created in Jenkins (ID: `jenkins-build`)
- [ ] Jenkins job created (psi-probe-build)
- [ ] Jenkinsfile paths updated (JAVA_HOME, MAVEN_HOME)
- [ ] Repository URL is correct
- [ ] Branch name is correct (master)

---

**Ready to build!** Click "Build Now" in Jenkins. 🚀
