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
package psiprobe.controllers.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.lang.management.ThreadMXBean;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.catalina.Context;
import org.apache.catalina.Manager;
import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import psiprobe.beans.ContainerWrapperBean;
import psiprobe.controllers.AbstractTomcatContainerController;
import psiprobe.model.Application;
import psiprobe.tools.ApplicationUtils;

/**
 * AJAX Controller for Modern Dashboard - Provides real-time metrics in JSON format.
 */
@Controller
public class DashboardAjaxController extends AbstractTomcatContainerController {

  /** The container wrapper. */
  @Autowired
  private ContainerWrapperBean containerWrapper;

  /** JSON object mapper. */
  private final ObjectMapper objectMapper = new ObjectMapper();

  /**
   * Memory metrics endpoint.
   *
   * @param request the request
   * @param response the response
   * @return null (writes JSON directly to response)
   * @throws Exception if an error occurs
   */
  @RequestMapping(path = "/memory.ajax")
  public ModelAndView getMemoryMetrics(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    
    Map<String, Object> metrics = new HashMap<>();
    
    // Get memory information
    MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
    MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();
    
    metrics.put("heapUsed", heapUsage.getUsed());
    metrics.put("heapMax", heapUsage.getMax());
    metrics.put("heapCommitted", heapUsage.getCommitted());
    metrics.put("nonHeapUsed", nonHeapUsage.getUsed());
    metrics.put("nonHeapMax", nonHeapUsage.getMax() > 0 ? nonHeapUsage.getMax() : nonHeapUsage.getCommitted());
    metrics.put("nonHeapCommitted", nonHeapUsage.getCommitted());
    
    // Metaspace (approximation from non-heap)
    metrics.put("metaspaceUsed", nonHeapUsage.getUsed());
    metrics.put("metaspaceMax", nonHeapUsage.getMax() > 0 ? nonHeapUsage.getMax() : nonHeapUsage.getCommitted());
    
    // GC statistics
    long youngGcCount = 0;
    long youngGcTime = 0;
    long oldGcCount = 0;
    long oldGcTime = 0;
    
    for (GarbageCollectorMXBean gcBean : ManagementFactory.getGarbageCollectorMXBeans()) {
      String name = gcBean.getName().toLowerCase();
      if (name.contains("young") || name.contains("scavenge") || name.contains("copy")) {
        youngGcCount += gcBean.getCollectionCount();
        youngGcTime += gcBean.getCollectionTime();
      } else {
        oldGcCount += gcBean.getCollectionCount();
        oldGcTime += gcBean.getCollectionTime();
      }
    }
    
    metrics.put("youngGcCount", youngGcCount);
    metrics.put("youngGcTime", youngGcTime);
    metrics.put("oldGcCount", oldGcCount);
    metrics.put("oldGcTime", oldGcTime);
    
    writeJson(response, metrics);
    return null;
  }

  /**
   * Thread metrics endpoint.
   *
   * @param request the request
   * @param response the response
   * @return null (writes JSON directly to response)
   * @throws Exception if an error occurs
   */
  @RequestMapping(path = "/threads.ajax")
  public ModelAndView getThreadMetrics(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    
    Map<String, Object> metrics = new HashMap<>();
    
    ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
    
    metrics.put("threadCount", threadBean.getThreadCount());
    metrics.put("peakThreadCount", threadBean.getPeakThreadCount());
    metrics.put("daemonThreadCount", threadBean.getDaemonThreadCount());
    metrics.put("totalStartedThreadCount", threadBean.getTotalStartedThreadCount());
    
    // Estimate max threads from connectors
    int maxThreads = 200; // Default
    try {
      List<Connector> connectors = containerWrapper.getTomcatContainer().findConnectors();
      maxThreads = connectors.stream()
          .mapToInt(c -> {
            Object maxThreadsObj = c.getProperty("maxThreads");
            return maxThreadsObj != null ? Integer.parseInt(maxThreadsObj.toString()) : 200;
          })
          .sum();
    } catch (Exception e) {
      logger.debug("Could not determine max threads", e);
    }
    
    metrics.put("maxThreads", maxThreads);
    
    // Thread states
    long[] threadIds = threadBean.getAllThreadIds();
    int runnable = 0;
    int blocked = 0;
    int waiting = 0;
    int timedWaiting = 0;
    
    for (long threadId : threadIds) {
      Thread.State state = threadBean.getThreadInfo(threadId).getThreadState();
      switch (state) {
        case RUNNABLE:
          runnable++;
          break;
        case BLOCKED:
          blocked++;
          break;
        case WAITING:
          waiting++;
          break;
        case TIMED_WAITING:
          timedWaiting++;
          break;
        default:
          break;
      }
    }
    
    metrics.put("runnable", runnable);
    metrics.put("blocked", blocked);
    metrics.put("waiting", waiting);
    metrics.put("timedWaiting", timedWaiting);
    
    writeJson(response, metrics);
    return null;
  }

  /**
   * Connector metrics endpoint.
   *
   * @param request the request
   * @param response the response
   * @return null (writes JSON directly to response)
   * @throws Exception if an error occurs
   */
  @RequestMapping(path = "/connectors.ajax")
  public ModelAndView getConnectorMetrics(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    
    Map<String, Object> result = new HashMap<>();
    List<Map<String, Object>> connectorList = new ArrayList<>();
    
    try {
      List<Connector> connectors = containerWrapper.getTomcatContainer().findConnectors();
      
      for (Connector connector : connectors) {
        Map<String, Object> connectorData = new HashMap<>();
        
        connectorData.put("name", connector.getProtocol() + "-" + connector.getPort());
        connectorData.put("protocol", connector.getProtocol());
        connectorData.put("port", connector.getPort());
        
        Object currentThreadsBusy = connector.getProperty("currentThreadsBusy");
        Object maxThreads = connector.getProperty("maxThreads");
        Object requestCount = connector.getProperty("requestCount");
        Object processingTime = connector.getProperty("processingTime");
        Object bytesSent = connector.getProperty("bytesSent");
        Object bytesReceived = connector.getProperty("bytesReceived");
        
        connectorData.put("currentThreadsBusy", currentThreadsBusy != null ? Integer.parseInt(currentThreadsBusy.toString()) : 0);
        connectorData.put("maxThreads", maxThreads != null ? Integer.parseInt(maxThreads.toString()) : 200);
        connectorData.put("requestCount", requestCount != null ? Long.parseLong(requestCount.toString()) : 0);
        connectorData.put("processingTime", processingTime != null ? Long.parseLong(processingTime.toString()) : 0);
        connectorData.put("bytesSent", bytesSent != null ? Long.parseLong(bytesSent.toString()) : 0);
        connectorData.put("bytesReceived", bytesReceived != null ? Long.parseLong(bytesReceived.toString()) : 0);
        
        connectorList.add(connectorData);
      }
    } catch (Exception e) {
      logger.error("Error fetching connector metrics", e);
    }
    
    result.put("connectors", connectorList);
    
    writeJson(response, result);
    return null;
  }

  /**
   * Application metrics endpoint.
   *
   * @param request the request
   * @param response the response
   * @return null (writes JSON directly to response)
   * @throws Exception if an error occurs
   */
  @RequestMapping(path = "/applications.ajax")
  public ModelAndView getApplicationMetrics(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    
    Map<String, Object> result = new HashMap<>();
    List<Map<String, Object>> appList = new ArrayList<>();
    
    try {
      List<Context> contexts = containerWrapper.getTomcatContainer().findContexts();
      
      for (Context context : contexts) {
        Application app = ApplicationUtils.getApplication(context, containerWrapper);
        
        Map<String, Object> appData = new HashMap<>();
        appData.put("name", app.getName().isEmpty() ? "/" : app.getName());
        appData.put("displayName", app.getDisplayName());
        appData.put("available", app.isAvailable());
        appData.put("sessionCount", app.getSessionCount());
        appData.put("requestCount", app.getRequestCount());
        appData.put("errorCount", app.getErrorCount());
        appData.put("avgResponseTime", app.getProcessingTime() > 0 && app.getRequestCount() > 0 
            ? app.getProcessingTime() / app.getRequestCount() : 0);
        
        appList.add(appData);
      }
    } catch (Exception e) {
      logger.error("Error fetching application metrics", e);
    }
    
    result.put("applications", appList);
    
    writeJson(response, result);
    return null;
  }

  /**
   * Datasource metrics endpoint.
   *
   * @param request the request
   * @param response the response
   * @return null (writes JSON directly to response)
   * @throws Exception if an error occurs
   */
  @RequestMapping(path = "/datasources.ajax")
  public ModelAndView getDatasourceMetrics(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    
    Map<String, Object> result = new HashMap<>();
    List<Map<String, Object>> dsList = new ArrayList<>();
    
    // Placeholder - actual implementation would query datasources
    // This would integrate with existing datasource controllers
    
    result.put("datasources", dsList);
    
    writeJson(response, result);
    return null;
  }

  /**
   * System metrics endpoint (OSHI integration).
   *
   * @param request the request
   * @param response the response
   * @return null (writes JSON directly to response)
   * @throws Exception if an error occurs
   */
  @RequestMapping(path = "/oshi.ajax")
  public ModelAndView getSystemMetrics(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    
    Map<String, Object> metrics = new HashMap<>();
    
    try {
      // Get system CPU load
      com.sun.management.OperatingSystemMXBean osBean = 
          (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
      
      metrics.put("cpuLoad", osBean.getSystemCpuLoad());
      metrics.put("processCpuLoad", osBean.getProcessCpuLoad());
      metrics.put("memoryUsed", osBean.getTotalPhysicalMemorySize() - osBean.getFreePhysicalMemorySize());
      metrics.put("memoryTotal", osBean.getTotalPhysicalMemorySize());
      metrics.put("swapUsed", osBean.getTotalSwapSpaceSize() - osBean.getFreeSwapSpaceSize());
      metrics.put("swapTotal", osBean.getTotalSwapSpaceSize());
      
    } catch (Exception e) {
      logger.debug("Could not fetch system metrics", e);
      // Return empty metrics if OSHI is not available
    }
    
    writeJson(response, metrics);
    return null;
  }

  /**
   * Write JSON response.
   *
   * @param response the HTTP response
   * @param data the data to serialize
   * @throws IOException if writing fails
   */
  private void writeJson(HttpServletResponse response, Object data) throws IOException {
    objectMapper.writeValue(response.getWriter(), data);
  }

  @Override
  protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    // Not used - individual methods handle requests
    return null;
  }

}
