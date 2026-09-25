/**
 * Infrastructure Dashboard
 * Main container for Phase 1 infrastructure widgets
 * Integrates VPSHealthWidget, SecurityPatrolWidget, and ExplorerMaintenanceWidget
 */

import React, { useEffect, useState } from "react";
import VPSHealthWidget from "./components/VPSHealthWidget";
import SecurityPatrolWidget from "./components/SecurityPatrolWidget";
import ExplorerMaintenanceWidget from "./components/ExplorerMaintenanceWidget";
import "./styles/infrastructure-widgets.css";

interface DashboardMetrics {
  widgetCount: number;
  apiEndpoints: number;
  refreshIntervals: string[];
  lastUpdated: Date | null;
}

export const InfrastructureDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    widgetCount: 3,
    apiEndpoints: 3,
    refreshIntervals: ["60s", "10s", "30s"],
    lastUpdated: null,
  });

  useEffect(() => {
    // Update metrics when component mounts
    setMetrics((prev) => ({
      ...prev,
      lastUpdated: new Date(),
    }));
  }, []);

  return (
    <div className="infrastructure-dashboard">
      <div className="dashboard-header">
        <h1>📊 Infrastructure Monitoring Dashboard</h1>
        <div className="dashboard-stats">
          <span className="stat-item">
            <span className="stat-label">Widgets:</span>
            <span className="stat-value">{metrics.widgetCount}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">API Endpoints:</span>
            <span className="stat-value">{metrics.apiEndpoints}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Refresh:</span>
            <span className="stat-value">{metrics.refreshIntervals.join(" / ")}</span>
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* VPS Health Widget - 60s refresh */}
        <div className="dashboard-widget-container">
          <VPSHealthWidget />
        </div>

        {/* Security Patrol Widget - 10s refresh */}
        <div className="dashboard-widget-container">
          <SecurityPatrolWidget />
        </div>

        {/* Explorer Maintenance Widget - 30s refresh */}
        <div className="dashboard-widget-container">
          <ExplorerMaintenanceWidget />
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="footer-info">
          <p>
            Last updated: {metrics.lastUpdated?.toLocaleTimeString() || "Never"}
          </p>
          <p>
            Data sources: /tmp/vps_health.json, security patrol logs,
            workspace health scans
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureDashboard;
