# Jenkins Quick Start - PSI Probe

## 🚀 5-Minute Setup

### 1️⃣ Create GitHub Credentials (2 minutes)

```
Jenkins → Manage Jenkins → Manage Credentials → Add Credentials

Kind: Username with password
Username: imthiyas63
Password: [GitHub Personal Access Token]
ID: jenkins-build
Description: GitHub credentials for probe
```

**Get GitHub Token:** https://github.com/settings/tokens
- Scopes needed: ✅ `repo`

---

### 2️⃣ Create Jenkins Job (2 minutes)

```
Jenkins → New Item → Pipeline

Name: psi-probe-build

Pipeline:
  Definition: Pipeline script from SCM
  SCM: Git
  Repository URL: https://github.com/imthiyas63/probe.git
  Credentials: jenkins-build
  Branch: */master
  Script Path: Jenkinsfile

Save
```

---

### 3️⃣ Build (1 minute)

```
Click: Build Now

Wait for: ✅ SUCCESS

Download: probe.war
```

---

## 📋 Updated Jenkinsfile

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

## 🔧 Customize Paths (if needed)

Edit these in Jenkinsfile:

```groovy
JAVA_HOME  = '/usr/lib/jvm/java-17-amazon-corretto'  // Your Java path
MAVEN_HOME = '/usr/app/maven/maven-3.9.11'           // Your Maven path
MAVEN_REPO = "/usr/app/maven/repository"             // Your Maven repo
```

---

## 📥 Download Artifact

After successful build:

```
http://jenkins-server/job/psi-probe-build/lastSuccessfulBuild/artifact/psi-probe-web/target/probe.war
```

Or click: **Build #X → Artifacts → probe.war**

---

## ✅ Success Checklist

- [ ] Credential `jenkins-build` created
- [ ] Job `psi-probe-build` created
- [ ] First build: ✅ SUCCESS
- [ ] Artifact `probe.war` available

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Credentials not found | Check ID is exactly `jenkins-build` |
| Permission denied | Use HTTPS URL, not SSH |
| Java not found | Update `JAVA_HOME` path |
| Maven not found | Update `MAVEN_HOME` path |
| Build fails | Check console output for errors |

---

## 📚 Full Documentation

See **JENKINS_SETUP.md** for complete guide with:
- Detailed credential setup
- Webhook configuration
- Email/Slack notifications
- Advanced troubleshooting

---

**Repository:** https://github.com/imthiyas63/probe.git  
**Credential ID:** `jenkins-build`  
**Artifact:** `probe.war`
