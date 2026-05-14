<%@ page contentType="text/html;charset=UTF-8" language="java" session="false" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://displaytag.sf.net" prefix="display" %>
<%@ taglib uri="/WEB-INF/tld/probe.tld" prefix="probe" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PSI Probe - Modern Dashboard</title>
    <link rel="stylesheet" href="<c:url value='/css/dashboard-modern.css'/>">
    <script src="<c:url value='/js/prototype.js'/>"></script>
    <script src="<c:url value='/js/dashboard-modern.js'/>"></script>
</head>
<body class="dashboard-body" data-theme="dark">
    
    <!-- Theme Toggle -->
    <div class="theme-toggle">
        <button id="themeToggle" onclick="toggleTheme()">
            <span class="icon-light">☀️</span>
            <span class="icon-dark">🌙</span>
        </button>
    </div>

    <!-- Main Dashboard Container -->
    <div class="dashboard-container">
        
        <!-- Header -->
        <header class="dashboard-header">
            <div class="header-left">
                <h1>PSI Probe Dashboard</h1>
                <span class="server-name">${serverInfo}</span>
            </div>
            <div class="header-right">
                <span class="last-update">Last updated: <span id="lastUpdate">--</span></span>
                <span class="auto-refresh">
                    <input type="checkbox" id="autoRefresh" checked>
                    <label for="autoRefresh">Auto-refresh (5s)</label>
                </span>
            </div>
        </header>

        <!-- Top KPI Bar -->
        <section class="kpi-bar">
            <div class="kpi-card" data-metric="heap">
                <div class="kpi-icon">💾</div>
                <div class="kpi-content">
                    <div class="kpi-label">Heap Usage</div>
                    <div class="kpi-value" id="heapUsage">-- MB</div>
                    <div class="kpi-subtext" id="heapPercent">--% of max</div>
                    <div class="kpi-sparkline" id="heapSparkline"></div>
                </div>
                <div class="kpi-status" id="heapStatus"></div>
            </div>

            <div class="kpi-card" data-metric="cpu">
                <div class="kpi-icon">⚡</div>
                <div class="kpi-content">
                    <div class="kpi-label">CPU Usage</div>
                    <div class="kpi-value" id="cpuUsage">--%</div>
                    <div class="kpi-subtext">System load</div>
                    <div class="kpi-sparkline" id="cpuSparkline"></div>
                </div>
                <div class="kpi-status" id="cpuStatus"></div>
            </div>

            <div class="kpi-card" data-metric="threads">
                <div class="kpi-icon">🧵</div>
                <div class="kpi-content">
                    <div class="kpi-label">Active Threads</div>
                    <div class="kpi-value" id="threadCount">--</div>
                    <div class="kpi-subtext" id="threadMax">of -- max</div>
                    <div class="kpi-sparkline" id="threadSparkline"></div>
                </div>
                <div class="kpi-status" id="threadStatus"></div>
            </div>

            <div class="kpi-card" data-metric="sessions">
                <div class="kpi-icon">👥</div>
                <div class="kpi-content">
                    <div class="kpi-label">Active Sessions</div>
                    <div class="kpi-value" id="sessionCount">--</div>
                    <div class="kpi-subtext">Across all apps</div>
                    <div class="kpi-sparkline" id="sessionSparkline"></div>
                </div>
                <div class="kpi-status" id="sessionStatus"></div>
            </div>

            <div class="kpi-card" data-metric="requests">
                <div class="kpi-icon">📊</div>
                <div class="kpi-content">
                    <div class="kpi-label">Request Rate</div>
                    <div class="kpi-value" id="requestRate">-- req/s</div>
                    <div class="kpi-subtext" id="requestTotal">-- total</div>
                    <div class="kpi-sparkline" id="requestSparkline"></div>
                </div>
                <div class="kpi-status" id="requestStatus"></div>
            </div>

            <div class="kpi-card" data-metric="errors">
                <div class="kpi-icon">⚠️</div>
                <div class="kpi-content">
                    <div class="kpi-label">Error Rate</div>
                    <div class="kpi-value" id="errorRate">--%</div>
                    <div class="kpi-subtext" id="errorCount">-- errors</div>
                    <div class="kpi-sparkline" id="errorSparkline"></div>
                </div>
                <div class="kpi-status" id="errorStatus"></div>
            </div>
        </section>

        <!-- Alert Banner -->
        <div id="alertBanner" class="alert-banner hidden"></div>

        <!-- Main Content Grid -->
        <div class="dashboard-grid">
            
            <!-- JVM Metrics Panel -->
            <div class="panel panel-large">
                <div class="panel-header">
                    <h2>JVM Memory</h2>
                    <div class="panel-actions">
                        <button onclick="gcNow()" class="btn-icon" title="Trigger GC">🗑️</button>
                        <button onclick="expandPanel('jvm')" class="btn-icon">⛶</button>
                    </div>
                </div>
                <div class="panel-content">
                    <div class="memory-grid">
                        <div class="memory-item">
                            <div class="memory-label">Heap Memory</div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="heapProgress" style="width: 0%"></div>
                                <span class="progress-text" id="heapText">0 MB / 0 MB</span>
                            </div>
                        </div>
                        <div class="memory-item">
                            <div class="memory-label">Non-Heap Memory</div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="nonHeapProgress" style="width: 0%"></div>
                                <span class="progress-text" id="nonHeapText">0 MB / 0 MB</span>
                            </div>
                        </div>
                        <div class="memory-item">
                            <div class="memory-label">Metaspace</div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="metaspaceProgress" style="width: 0%"></div>
                                <span class="progress-text" id="metaspaceText">0 MB / 0 MB</span>
                            </div>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="memoryChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>

            <!-- GC Metrics Panel -->
            <div class="panel panel-medium">
                <div class="panel-header">
                    <h2>Garbage Collection</h2>
                    <button onclick="expandPanel('gc')" class="btn-icon">⛶</button>
                </div>
                <div class="panel-content">
                    <div class="gc-stats">
                        <div class="stat-item">
                            <div class="stat-label">Young GC Count</div>
                            <div class="stat-value" id="youngGcCount">--</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Young GC Time</div>
                            <div class="stat-value" id="youngGcTime">-- ms</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Old GC Count</div>
                            <div class="stat-value" id="oldGcCount">--</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Old GC Time</div>
                            <div class="stat-value" id="oldGcTime">-- ms</div>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="gcChart" width="300" height="150"></canvas>
                    </div>
                </div>
            </div>

            <!-- Thread States Panel -->
            <div class="panel panel-medium">
                <div class="panel-header">
                    <h2>Thread States</h2>
                    <button onclick="location.href='threads.htm'" class="btn-icon">→</button>
                </div>
                <div class="panel-content">
                    <div class="thread-states">
                        <div class="thread-state-item">
                            <span class="state-dot state-runnable"></span>
                            <span class="state-label">RUNNABLE</span>
                            <span class="state-count" id="threadRunnable">--</span>
                        </div>
                        <div class="thread-state-item">
                            <span class="state-dot state-blocked"></span>
                            <span class="state-label">BLOCKED</span>
                            <span class="state-count" id="threadBlocked">--</span>
                        </div>
                        <div class="thread-state-item">
                            <span class="state-dot state-waiting"></span>
                            <span class="state-label">WAITING</span>
                            <span class="state-count" id="threadWaiting">--</span>
                        </div>
                        <div class="thread-state-item">
                            <span class="state-dot state-timed-waiting"></span>
                            <span class="state-label">TIMED_WAITING</span>
                            <span class="state-count" id="threadTimedWaiting">--</span>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="threadChart" width="300" height="150"></canvas>
                    </div>
                </div>
            </div>

            <!-- Connector Metrics Panel -->
            <div class="panel panel-large">
                <div class="panel-header">
                    <h2>Tomcat Connectors</h2>
                    <button onclick="location.href='connectors.htm'" class="btn-icon">→</button>
                </div>
                <div class="panel-content">
                    <div class="connector-list" id="connectorList">
                        <!-- Dynamically populated -->
                    </div>
                </div>
            </div>

            <!-- Application Metrics Panel -->
            <div class="panel panel-large">
                <div class="panel-header">
                    <h2>Applications</h2>
                    <button onclick="location.href='applications.htm'" class="btn-icon">→</button>
                </div>
                <div class="panel-content">
                    <div class="app-table">
                        <table id="appTable">
                            <thead>
                                <tr>
                                    <th>Application</th>
                                    <th>Status</th>
                                    <th>Sessions</th>
                                    <th>Requests</th>
                                    <th>Errors</th>
                                    <th>Avg Response</th>
                                </tr>
                            </thead>
                            <tbody id="appTableBody">
                                <!-- Dynamically populated -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- JDBC Pool Panel -->
            <div class="panel panel-medium">
                <div class="panel-header">
                    <h2>JDBC Connection Pools</h2>
                    <button onclick="location.href='datasources.htm'" class="btn-icon">→</button>
                </div>
                <div class="panel-content">
                    <div class="jdbc-pools" id="jdbcPools">
                        <!-- Dynamically populated -->
                    </div>
                </div>
            </div>

            <!-- Top Slow Endpoints Panel -->
            <div class="panel panel-medium">
                <div class="panel-header">
                    <h2>Slowest Endpoints (Top 10)</h2>
                    <button onclick="refreshSlowEndpoints()" class="btn-icon">🔄</button>
                </div>
                <div class="panel-content">
                    <div class="slow-endpoints" id="slowEndpoints">
                        <!-- Dynamically populated -->
                    </div>
                </div>
            </div>

            <!-- System Metrics Panel (Optional) -->
            <div class="panel panel-medium">
                <div class="panel-header">
                    <h2>System Resources</h2>
                    <button onclick="location.href='oshi.htm'" class="btn-icon">→</button>
                </div>
                <div class="panel-content">
                    <div class="system-stats">
                        <div class="stat-item">
                            <div class="stat-label">System CPU</div>
                            <div class="stat-value" id="systemCpu">--%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">System Memory</div>
                            <div class="stat-value" id="systemMemory">-- GB</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Disk Usage</div>
                            <div class="stat-value" id="diskUsage">--%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Network I/O</div>
                            <div class="stat-value" id="networkIO">-- MB/s</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay hidden">
        <div class="spinner"></div>
    </div>

</body>
</html>
