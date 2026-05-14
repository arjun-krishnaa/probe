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

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import psiprobe.controllers.AbstractTomcatContainerController;

/**
 * Modern Dashboard Controller - Main entry point for the redesigned dashboard.
 */
@Controller
public class ModernDashboardController extends AbstractTomcatContainerController {

  /** The view name. */
  private String viewName;

  /**
   * Gets the view name.
   *
   * @return the view name
   */
  public String getViewName() {
    return viewName;
  }

  /**
   * Sets the view name.
   *
   * @param viewName the new view name
   */
  @Value("dashboard")
  public void setViewName(String viewName) {
    this.viewName = viewName;
  }

  @RequestMapping(path = "/dashboard.htm")
  @Override
  public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response)
      throws Exception {
    
    ModelAndView mv = new ModelAndView(getViewName());
    
    // Add server information
    mv.addObject("serverInfo", getContainerWrapper().getTomcatContainer().getName());
    
    return mv;
  }

}
