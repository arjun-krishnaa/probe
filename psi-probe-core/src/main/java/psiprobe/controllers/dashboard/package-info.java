/*
 * Licensed under the GPL License. You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * THIS PACKAGE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING,
 * WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTIBILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE.
 */

/**
 * Modern Dashboard Controllers.
 * 
 * <p>
 * This package contains controllers for the redesigned PSI Probe dashboard with modern UI/UX.
 * The dashboard provides real-time monitoring with low overhead and actionable insights.
 * </p>
 * 
 * <h2>Features:</h2>
 * <ul>
 *   <li>Real-time KPI monitoring (Heap, CPU, Threads, Sessions, Requests, Errors)</li>
 *   <li>JVM metrics with memory pools and GC statistics</li>
 *   <li>Thread state visualization</li>
 *   <li>Tomcat connector metrics</li>
 *   <li>Application health monitoring</li>
 *   <li>JDBC connection pool tracking</li>
 *   <li>System resource monitoring (optional)</li>
 *   <li>Dark/Light theme support</li>
 *   <li>Auto-refresh every 5 seconds</li>
 *   <li>Color-coded alerts (Green/Yellow/Red)</li>
 * </ul>
 * 
 * <h2>Controllers:</h2>
 * <ul>
 *   <li>{@link psiprobe.controllers.dashboard.ModernDashboardController} - Main dashboard view</li>
 *   <li>{@link psiprobe.controllers.dashboard.DashboardAjaxController} - AJAX endpoints for metrics</li>
 * </ul>
 * 
 * <h2>AJAX Endpoints:</h2>
 * <ul>
 *   <li>/probe/memory.ajax - JVM memory and GC metrics</li>
 *   <li>/probe/threads.ajax - Thread count and states</li>
 *   <li>/probe/connectors.ajax - Connector statistics</li>
 *   <li>/probe/applications.ajax - Application metrics</li>
 *   <li>/probe/datasources.ajax - JDBC pool metrics</li>
 *   <li>/probe/oshi.ajax - System resource metrics</li>
 * </ul>
 * 
 * <h2>Performance:</h2>
 * <p>
 * The dashboard is designed for low overhead (&lt;2% CPU) with:
 * </p>
 * <ul>
 *   <li>Async data fetching</li>
 *   <li>Efficient metric caching</li>
 *   <li>Minimal DOM manipulation</li>
 *   <li>Lightweight sparklines</li>
 * </ul>
 * 
 * @since 5.3.1
 */
package psiprobe.controllers.dashboard;
