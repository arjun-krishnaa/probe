/**
 * PSI Probe Modern Dashboard JavaScript
 * Real-time monitoring with low overhead
 */

// Global state
const DashboardState = {
    autoRefresh: true,
    refreshInterval: 5000, // 5 seconds
    timerId: null,
    metrics: {
        heap: [],
        cpu: [],
        threads: [],
        sessions: [],
        requests: [],
        errors: []
    },
    thresholds: {
        heapWarning: 70,
        heapCritical: 85,
        cpuWarning: 70,
        cpuCritical: 90,
        threadWarning: 80,
        threadCritical: 95,
        errorWarning: 1,
        errorCritical: 5
    }
};

// Initialize dashboard on load
document.observe('dom:loaded', function() {
    initializeDashboard();
    setupEventListeners();
    startAutoRefresh();
});

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    console.log('Initializing PSI Probe Modern Dashboard...');
    loadTheme();
    fetchAllMetrics();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const autoRefreshCheckbox = $('autoRefresh');
    if (autoRefreshCheckbox) {
        autoRefreshCheckbox.observe('change', function() {
            DashboardState.autoRefresh = this.checked;
            if (this.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
    }
}

/**
 * Theme management
 */
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

/**
 * Auto-refresh management
 */
function startAutoRefresh() {
    if (DashboardState.timerId) {
        clearInterval(DashboardState.timerId);
    }
    DashboardState.timerId = setInterval(fetchAllMetrics, DashboardState.refreshInterval);
}

function stopAutoRefresh() {
    if (DashboardState.timerId) {
        clearInterval(DashboardState.timerId);
        DashboardState.timerId = null;
    }
}

/**
 * Fetch all metrics (main data collection)
 */
function fetchAllMetrics() {
    showLoading(false);
    updateLastUpdateTime();
    
    // Fetch metrics in parallel using AJAX
    Promise.all([
        fetchJvmMetrics(),
        fetchThreadMetrics(),
        fetchConnectorMetrics(),
        fetchApplicationMetrics(),
        fetchJdbcMetrics(),
        fetchSystemMetrics()
    ]).then(() => {
        hideLoading();
    }).catch(error => {
        console.error('Error fetching metrics:', error);
        hideLoading();
        showAlert('Failed to fetch metrics. Check console for details.');
    });
}

/**
 * Fetch JVM metrics
 */
function fetchJvmMetrics() {
    return new Promise((resolve, reject) => {
        new Ajax.Request('/probe/memory.ajax', {
            method: 'get',
            onSuccess: function(transport) {
                try {
                    const data = transport.responseJSON || JSON.parse(transport.responseText);
                    updateJvmMetrics(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onFailure: function() {
                reject(new Error('Failed to fetch JVM metrics'));
            }
        });
    });
}

/**
 * Update JVM metrics in UI
 */
function updateJvmMetrics(data) {
    // Heap usage
    const heapUsed = data.heapUsed || 0;
    const heapMax = data.heapMax || 1;
    const heapPercent = Math.round((heapUsed / heapMax) * 100);
    
    updateElement('heapUsage', formatBytes(heapUsed));
    updateElement('heapPercent', heapPercent + '% of ' + formatBytes(heapMax));
    updateElement('heapText', formatBytes(heapUsed) + ' / ' + formatBytes(heapMax));
    updateProgressBar('heapProgress', heapPercent);
    updateStatus('heapStatus', heapPercent, DashboardState.thresholds.heapWarning, DashboardState.thresholds.heapCritical);
    
    // Store for sparkline
    DashboardState.metrics.heap.push(heapPercent);
    if (DashboardState.metrics.heap.length > 20) {
        DashboardState.metrics.heap.shift();
    }
    updateSparkline('heapSparkline', DashboardState.metrics.heap);
    
    // Non-heap
    const nonHeapUsed = data.nonHeapUsed || 0;
    const nonHeapMax = data.nonHeapMax || 1;
    const nonHeapPercent = Math.round((nonHeapUsed / nonHeapMax) * 100);
    updateElement('nonHeapText', formatBytes(nonHeapUsed) + ' / ' + formatBytes(nonHeapMax));
    updateProgressBar('nonHeapProgress', nonHeapPercent);
    
    // Metaspace
    const metaspaceUsed = data.metaspaceUsed || 0;
    const metaspaceMax = data.metaspaceMax || 1;
    const metaspacePercent = Math.round((metaspaceUsed / metaspaceMax) * 100);
    updateElement('metaspaceText', formatBytes(metaspaceUsed) + ' / ' + formatBytes(metaspaceMax));
    updateProgressBar('metaspaceProgress', metaspacePercent);
    
    // GC stats
    updateElement('youngGcCount', data.youngGcCount || 0);
    updateElement('youngGcTime', (data.youngGcTime || 0) + ' ms');
    updateElement('oldGcCount', data.oldGcCount || 0);
    updateElement('oldGcTime', (data.oldGcTime || 0) + ' ms');
}

/**
 * Fetch thread metrics
 */
function fetchThreadMetrics() {
    return new Promise((resolve, reject) => {
        new Ajax.Request('/probe/threads.ajax', {
            method: 'get',
            onSuccess: function(transport) {
                try {
                    const data = transport.responseJSON || JSON.parse(transport.responseText);
                    updateThreadMetrics(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onFailure: function() {
                reject(new Error('Failed to fetch thread metrics'));
            }
        });
    });
}

/**
 * Update thread metrics in UI
 */
function updateThreadMetrics(data) {
    const threadCount = data.threadCount || 0;
    const maxThreads = data.maxThreads || 100;
    const threadPercent = Math.round((threadCount / maxThreads) * 100);
    
    updateElement('threadCount', threadCount);
    updateElement('threadMax', 'of ' + maxThreads + ' max');
    updateStatus('threadStatus', threadPercent, DashboardState.thresholds.threadWarning, DashboardState.thresholds.threadCritical);
    
    // Store for sparkline
    DashboardState.metrics.threads.push(threadCount);
    if (DashboardState.metrics.threads.length > 20) {
        DashboardState.metrics.threads.shift();
    }
    updateSparkline('threadSparkline', DashboardState.metrics.threads);
    
    // Thread states
    updateElement('threadRunnable', data.runnable || 0);
    updateElement('threadBlocked', data.blocked || 0);
    updateElement('threadWaiting', data.waiting || 0);
    updateElement('threadTimedWaiting', data.timedWaiting || 0);
}

/**
 * Fetch connector metrics
 */
function fetchConnectorMetrics() {
    return new Promise((resolve, reject) => {
        new Ajax.Request('/probe/connectors.ajax', {
            method: 'get',
            onSuccess: function(transport) {
                try {
                    const data = transport.responseJSON || JSON.parse(transport.responseText);
                    updateConnectorMetrics(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onFailure: function() {
                reject(new Error('Failed to fetch connector metrics'));
            }
        });
    });
}

/**
 * Update connector metrics in UI
 */
function updateConnectorMetrics(data) {
    const connectorList = $('connectorList');
    if (!connectorList) return;
    
    let html = '';
    const connectors = data.connectors || [];
    
    connectors.each(function(connector) {
        const busyPercent = Math.round((connector.currentThreadsBusy / connector.maxThreads) * 100);
        html += '<div class="connector-item">';
        html += '  <div class="connector-header">';
        html += '    <span class="connector-name">' + connector.name + '</span>';
        html += '    <span class="connector-status running">RUNNING</span>';
        html += '  </div>';
        html += '  <div class="connector-stats">';
        html += '    <div class="connector-stat">';
        html += '      <div class="connector-stat-label">Busy Threads</div>';
        html += '      <div class="connector-stat-value">' + connector.currentThreadsBusy + ' / ' + connector.maxThreads + '</div>';
        html += '    </div>';
        html += '    <div class="connector-stat">';
        html += '      <div class="connector-stat-label">Requests</div>';
        html += '      <div class="connector-stat-value">' + formatNumber(connector.requestCount) + '</div>';
        html += '    </div>';
        html += '    <div class="connector-stat">';
        html += '      <div class="connector-stat-label">Avg Time</div>';
        html += '      <div class="connector-stat-value">' + connector.processingTime + ' ms</div>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    });
    
    connectorList.innerHTML = html;
    
    // Update request rate KPI
    const totalRequests = connectors.reduce((sum, c) => sum + (c.requestCount || 0), 0);
    updateElement('requestRate', (totalRequests / 60).toFixed(1) + ' req/s');
    updateElement('requestTotal', formatNumber(totalRequests) + ' total');
}

/**
 * Fetch application metrics
 */
function fetchApplicationMetrics() {
    return new Promise((resolve, reject) => {
        new Ajax.Request('/probe/applications.ajax', {
            method: 'get',
            onSuccess: function(transport) {
                try {
                    const data = transport.responseJSON || JSON.parse(transport.responseText);
                    updateApplicationMetrics(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onFailure: function() {
                reject(new Error('Failed to fetch application metrics'));
            }
        });
    });
}

/**
 * Update application metrics in UI
 */
function updateApplicationMetrics(data) {
    const appTableBody = $('appTableBody');
    if (!appTableBody) return;
    
    let html = '';
    const apps = data.applications || [];
    let totalSessions = 0;
    let totalErrors = 0;
    
    apps.each(function(app) {
        totalSessions += app.sessionCount || 0;
        totalErrors += app.errorCount || 0;
        
        const statusClass = app.available ? 'running' : 'stopped';
        const statusText = app.available ? 'RUNNING' : 'STOPPED';
        const errorRate = app.requestCount > 0 ? ((app.errorCount / app.requestCount) * 100).toFixed(2) : 0;
        
        html += '<tr>';
        html += '  <td>' + app.name + '</td>';
        html += '  <td><span class="app-status ' + statusClass + '">' + statusText + '</span></td>';
        html += '  <td>' + (app.sessionCount || 0) + '</td>';
        html += '  <td>' + formatNumber(app.requestCount || 0) + '</td>';
        html += '  <td class="' + (app.errorCount > 0 ? 'text-danger' : '') + '">' + (app.errorCount || 0) + '</td>';
        html += '  <td>' + (app.avgResponseTime || 0) + ' ms</td>';
        html += '</tr>';
    });
    
    appTableBody.innerHTML = html;
    
    // Update session KPI
    updateElement('sessionCount', totalSessions);
    DashboardState.metrics.sessions.push(totalSessions);
    if (DashboardState.metrics.sessions.length > 20) {
        DashboardState.metrics.sessions.shift();
    }
    updateSparkline('sessionSparkline', DashboardState.metrics.sessions);
    
    // Update error KPI
    const errorPercent = apps.length > 0 ? (totalErrors / apps.length).toFixed(1) : 0;
    updateElement('errorRate', errorPercent + '%');
    updateElement('errorCount', totalErrors + ' errors');
    updateStatus('errorStatus', totalErrors, DashboardState.thresholds.errorWarning, DashboardState.thresholds.errorCritical);
}

/**
 * Fetch JDBC metrics
 */
function fetchJdbcMetrics() {
    return new Promise((resolve, reject) => {
        new Ajax.Request('/probe/datasources.ajax', {
            method: 'get',
            onSuccess: function(transport) {
                try {
                    const data = transport.responseJSON || JSON.parse(transport.responseText);
                    updateJdbcMetrics(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onFailure: function() {
                reject(new Error('Failed to fetch JDBC metrics'));
            }
        });
    });
}

/**
 * Update JDBC metrics in UI
 */
function updateJdbcMetrics(data) {
    const jdbcPools = $('jdbcPools');
    if (!jdbcPools) return;
    
    let html = '';
    const pools = data.datasources || [];
    
    pools.each(function(pool) {
        const activePercent = Math.round((pool.busyConnections / pool.maxConnections) * 100);
        html += '<div class="jdbc-pool-item">';
        html += '  <div class="jdbc-pool-name">' + pool.name + '</div>';
        html += '  <div class="jdbc-pool-stats">';
        html += '    <div class="stat-item">';
        html += '      <div class="stat-label">Active</div>';
        html += '      <div class="stat-value">' + pool.busyConnections + ' / ' + pool.maxConnections + '</div>';
        html += '    </div>';
        html += '    <div class="stat-item">';
        html += '      <div class="stat-label">Idle</div>';
        html += '      <div class="stat-value">' + pool.idleConnections + '</div>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    });
    
    jdbcPools.innerHTML = html || '<p style="color: var(--text-secondary);">No datasources configured</p>';
}

/**
 * Fetch system metrics
 */
function fetchSystemMetrics() {
    return new Promise((resolve, reject) => {
        new Ajax.Request('/probe/oshi.ajax', {
            method: 'get',
            onSuccess: function(transport) {
                try {
                    const data = transport.responseJSON || JSON.parse(transport.responseText);
                    updateSystemMetrics(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onFailure: function() {
                // System metrics are optional
                resolve({});
            }
        });
    });
}

/**
 * Update system metrics in UI
 */
function updateSystemMetrics(data) {
    if (data.cpuLoad !== undefined) {
        const cpuPercent = Math.round(data.cpuLoad * 100);
        updateElement('cpuUsage', cpuPercent + '%');
        updateElement('systemCpu', cpuPercent + '%');
        updateStatus('cpuStatus', cpuPercent, DashboardState.thresholds.cpuWarning, DashboardState.thresholds.cpuCritical);
        
        DashboardState.metrics.cpu.push(cpuPercent);
        if (DashboardState.metrics.cpu.length > 20) {
            DashboardState.metrics.cpu.shift();
        }
        updateSparkline('cpuSparkline', DashboardState.metrics.cpu);
    }
    
    if (data.memoryUsed && data.memoryTotal) {
        updateElement('systemMemory', formatBytes(data.memoryUsed) + ' / ' + formatBytes(data.memoryTotal));
    }
    
    if (data.diskUsage !== undefined) {
        updateElement('diskUsage', Math.round(data.diskUsage) + '%');
    }
    
    if (data.networkIO !== undefined) {
        updateElement('networkIO', formatBytes(data.networkIO) + '/s');
    }
}

/**
 * Utility: Update element text
 */
function updateElement(id, value) {
    const element = $(id);
    if (element) {
        element.innerHTML = value;
    }
}

/**
 * Utility: Update progress bar
 */
function updateProgressBar(id, percent) {
    const element = $(id);
    if (element) {
        element.style.width = percent + '%';
        element.className = 'progress-fill';
        if (percent >= DashboardState.thresholds.heapCritical) {
            element.addClassName('critical');
        } else if (percent >= DashboardState.thresholds.heapWarning) {
            element.addClassName('warning');
        }
    }
}

/**
 * Utility: Update status indicator
 */
function updateStatus(id, value, warningThreshold, criticalThreshold) {
    const element = $(id);
    if (element) {
        element.className = 'kpi-status';
        if (value >= criticalThreshold) {
            element.addClassName('critical');
        } else if (value >= warningThreshold) {
            element.addClassName('warning');
        } else {
            element.addClassName('healthy');
        }
    }
}

/**
 * Utility: Update sparkline (simple ASCII-style)
 */
function updateSparkline(id, data) {
    const element = $(id);
    if (!element || data.length === 0) return;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    let html = '<svg width="100%" height="30" style="display: block;">';
    const width = 100 / data.length;
    
    data.forEach((value, index) => {
        const height = ((value - min) / range) * 25 + 2;
        const x = index * width;
        html += '<rect x="' + x + '%" y="' + (30 - height) + '" width="' + (width - 1) + '%" height="' + height + '" fill="var(--accent-primary)" opacity="0.7"/>';
    });
    
    html += '</svg>';
    element.innerHTML = html;
}

/**
 * Utility: Format bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility: Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Utility: Update last update time
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    updateElement('lastUpdate', timeString);
}

/**
 * Utility: Show loading overlay
 */
function showLoading(fullScreen = true) {
    const overlay = $('loadingOverlay');
    if (overlay && fullScreen) {
        overlay.removeClassName('hidden');
    }
}

/**
 * Utility: Hide loading overlay
 */
function hideLoading() {
    const overlay = $('loadingOverlay');
    if (overlay) {
        overlay.addClassName('hidden');
    }
}

/**
 * Utility: Show alert banner
 */
function showAlert(message) {
    const banner = $('alertBanner');
    if (banner) {
        banner.innerHTML = '⚠️ ' + message;
        banner.removeClassName('hidden');
        setTimeout(function() {
            banner.addClassName('hidden');
        }, 5000);
    }
}

/**
 * Action: Trigger garbage collection
 */
function gcNow() {
    if (confirm('Trigger garbage collection now?')) {
        new Ajax.Request('/probe/adm/advisegc.ajax', {
            method: 'post',
            onSuccess: function() {
                showAlert('Garbage collection triggered successfully');
                setTimeout(fetchJvmMetrics, 2000);
            },
            onFailure: function() {
                showAlert('Failed to trigger garbage collection');
            }
        });
    }
}

/**
 * Action: Expand panel (navigate to detail page)
 */
function expandPanel(type) {
    const urls = {
        'jvm': '/probe/memory.htm',
        'gc': '/probe/memory.htm',
        'threads': '/probe/threads.htm'
    };
    if (urls[type]) {
        window.location.href = urls[type];
    }
}

/**
 * Action: Refresh slow endpoints
 */
function refreshSlowEndpoints() {
    // Placeholder for slow endpoint tracking
    const container = $('slowEndpoints');
    if (container) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Endpoint tracking coming soon...</p>';
    }
}
