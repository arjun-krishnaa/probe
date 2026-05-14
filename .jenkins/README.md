# Jenkins Pipeline Configuration for PSI Probe

## Overview

This directory contains Jenkins pipeline configurations for building PSI Probe.

## Available Pipelines

### 1. Jenkinsfile (Full Pipeline)
**Location:** `../Jenkinsfile`

**Features:**
- ✅ Full build with all stages
- ✅ Unit tests execution
- ✅ Test coverage reporting
- ✅ Artifact archiving with versioning
- ✅ SonarQube integration (optional)
- ✅ Deployment to artifact repository
- ✅ Email notifications
- ✅ Build info generation

**Use Case:** Production builds, release branches

### 2. Jenkinsfile.simple (Quick Build)
**Location:** `../Jenkinsfile.simple`

**Features:**
- ✅ Quick build and package
- ✅ Basic test execution
- ✅ Artifact archiving
- ✅ Minimal configuration

**Use Case:** Development builds, feature branches, quick testing

## Prerequisites

### Required Software:
- **Java:** 17 or higher
- **Maven:** 3.9.12 or higher
- **Git:** Any recent version

### Jenkins Plugins Required:
- Pipeline
- Git
- JUnit
- JaCoCo (for coverage)
- SonarQube Scanner (optional)
- Email Extension (optional)

## Setup Instructions

### 1. Create Jenkins Job

#### Option A: Pipeline from SCM
1. New Item → Pipeline
2. Pipeline → Definition: "Pipeline script from SCM"
3. SCM: Git
4. Repository URL: `https://github.com/imthiyas63/probe.git`
5. Script Path: `Jenkinsfile` (or `Jenkinsfile.simple`)
6. Save

#### Option B: Multibranch Pipeline
1. New Item → Multibranch Pipeline
2. Branch Sources → Add source → Git
3. Project Repository: `https://github.com/imthiyas63/probe.git`
4. Build Configuration → Mode: by Jenkinsfile
5. Script Path: `Jenkinsfile`
6. Save

### 2. Configure Environment Variables

Edit the Jenkinsfile and update these paths:

```groovy
environment {
    JAVA_HOME  = '/usr/lib/jvm/java-17-amazon-corretto'  // Update to your Java path
    MAVEN_HOME = '/usr/app/maven/maven-3.9.11'           // Update to your Maven path
    MAVEN_REPO = "/usr/app/maven/repository"             // Update to your Maven repo
}
```

### 3. Configure Jenkins Global Tools

**Jenkins → Manage Jenkins → Global Tool Configuration:**

#### JDK:
- Name: `Java 17`
- JAVA_HOME: `/usr/lib/jvm/java-17-amazon-corretto`

#### Maven:
- Name: `Maven 3.9.11`
- MAVEN_HOME: `/usr/app/maven/maven-3.9.11`

### 4. Configure Credentials (if needed)

For private repositories:
1. Jenkins → Credentials → System → Global credentials
2. Add Credentials → Username with password
3. ID: `github-credentials`
4. Use in pipeline: `credentialsId: 'github-credentials'`

## Pipeline Stages

### Full Pipeline (Jenkinsfile):

```
1. Initialize      - Verify environment, clean workspace
2. Checkout        - Clone repository
3. Build           - Compile source code
4. Test            - Run unit tests
5. Package         - Create WAR file
6. Archive         - Save artifacts
7. Quality         - SonarQube analysis (optional)
8. Deploy          - Deploy to repository (master only)
```

### Simple Pipeline (Jenkinsfile.simple):

```
1. Build & Package - Compile and create WAR
2. Archive         - Save artifacts
```

## Artifacts

### Generated Artifacts:
- `probe.war` - Main deployable WAR file
- `probe-{version}-{commit}.war` - Versioned WAR file
- `build-info.txt` - Build metadata
- `*.jar` - Module JAR files (optional)

### Download Artifacts:
```
http://jenkins-server/job/psi-probe/{BUILD_NUMBER}/artifact/psi-probe-web/target/probe.war
```

## Build Parameters

### Maven Properties:
```bash
-Dbuild.version=${BUILD_NUMBER}
-Dbuild.time="${BUILD_TIME}"
-Dbuild.branch=${BRANCH_NAME}
-Dbuild.number=${BUILD_NUMBER}
-Dgit.commit=${GIT_COMMIT_SHORT}
```

### Skip Tests:
```bash
-DskipTests=true
```

### Custom Maven Repository:
```bash
-Dmaven.repo.local=/custom/path/to/repo
```

## Customization

### Add Email Notifications:

Uncomment in `post` section:

```groovy
emailext(
    subject: "PSI Probe Build #${env.BUILD_NUMBER} - ${currentBuild.result}",
    body: "Build details: ${env.BUILD_URL}",
    to: 'team@example.com'
)
```

### Add Slack Notifications:

```groovy
post {
    success {
        slackSend(
            color: 'good',
            message: "Build #${env.BUILD_NUMBER} succeeded: ${env.BUILD_URL}"
        )
    }
}
```

### Add SonarQube Analysis:

1. Install SonarQube Scanner plugin
2. Configure SonarQube server in Jenkins
3. Create `sonar-project.properties` in project root
4. Pipeline will automatically run analysis

### Add Deployment Stage:

```groovy
stage('Deploy to Tomcat') {
    steps {
        sh """
            scp psi-probe-web/target/probe.war user@server:/opt/tomcat/webapps/
            ssh user@server 'systemctl restart tomcat'
        """
    }
}
```

## Troubleshooting

### Issue: Java not found
**Solution:** Update `JAVA_HOME` in Jenkinsfile

### Issue: Maven not found
**Solution:** Update `MAVEN_HOME` in Jenkinsfile

### Issue: Build fails with "Permission denied"
**Solution:** Ensure Jenkins user has execute permissions:
```bash
chmod +x mvnw
```

### Issue: Tests fail
**Solution:** Run with `-DskipTests=true` to skip tests temporarily

### Issue: Out of memory
**Solution:** Increase Maven memory:
```groovy
environment {
    MAVEN_OPTS = '-Xmx4096m -XX:MaxPermSize=1024m'
}
```

## Performance Tips

### 1. Use Local Maven Repository:
```groovy
MAVEN_REPO = "/var/jenkins_home/.m2/repository"
```

### 2. Enable Parallel Builds:
```groovy
options {
    parallelsAlwaysFailFast()
}
```

### 3. Cache Dependencies:
```groovy
stage('Cache Dependencies') {
    steps {
        cache(maxCacheSize: 1000, caches: [
            arbitraryFileCache(path: '.m2/repository', cacheValidityDecidingFile: 'pom.xml')
        ])
    }
}
```

### 4. Skip Unnecessary Stages:
```groovy
when {
    branch 'master'  // Only run on master branch
}
```

## Monitoring

### Build Metrics:
- Build duration
- Test pass rate
- Code coverage
- Artifact size

### Jenkins Dashboard:
- Build history
- Test trends
- Coverage trends
- Build time trends

## Security

### Best Practices:
1. ✅ Use credentials for sensitive data
2. ✅ Don't commit passwords in Jenkinsfile
3. ✅ Use Jenkins secrets management
4. ✅ Restrict artifact access
5. ✅ Enable build authentication

### Example with Credentials:
```groovy
environment {
    NEXUS_CREDS = credentials('nexus-credentials')
}

steps {
    sh """
        ${MAVEN_CMD} deploy \
            -Dnexus.username=${NEXUS_CREDS_USR} \
            -Dnexus.password=${NEXUS_CREDS_PSW}
    """
}
```

## Support

### Documentation:
- Jenkins Pipeline: https://www.jenkins.io/doc/book/pipeline/
- Maven: https://maven.apache.org/guides/
- PSI Probe: https://github.com/psi-probe/psi-probe

### Issues:
- Report issues: https://github.com/imthiyas63/probe/issues
- Jenkins support: https://www.jenkins.io/participate/

---

**Last Updated:** 2026-05-14  
**Version:** 1.0  
**Maintainer:** PSI Probe Team
