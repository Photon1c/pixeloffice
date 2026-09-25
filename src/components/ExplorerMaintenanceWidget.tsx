import React, { useState, useEffect } from "react";
import "../styles/infrastructure-widgets.css";

interface WorkspaceHealthData {
  timestamp: string;
  diskUsagePercent: number;
  diskUsageGb: number;
  diskTotalGb: number;
  fileCount: number;
  directoryCount: number;
  largestDirectories: Array<{ name: string; sizeGb: number; fileCount: number }>;
  gitStatus: { [key: string]: { status: "clean" | "dirty" | "ahead" | "behind"; files?: number } };
  maintenanceTasks: Array<{
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    lastRun?: string;
    nextScheduled?: string;
  }>;
  fileSystemHealth: "healthy" | "warning" | "critical";
  cacheSize: { name: string; sizeGb: number }[];
  recommendedActions: string[];
  backupStatus: { lastBackup: string; status: "ok" | "overdue" | "failed" };
}

export const ExplorerMaintenanceWidget: React.FC = () => {
  const [data, setData] = useState<WorkspaceHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirectory, setExpandedDirectory] = useState<number | null>(null);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const response = await fetch("/api/infrastructure/explorer-maintenance");
        if (!response.ok) throw new Error("Failed to fetch maintenance data");
        const json = await response.json();
        setData(json);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenance();
    const interval = setInterval(fetchMaintenance, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="widget-container explorer-maintenance-widget">
      <div className="widget-header">Explorer Maintenance</div>
      <div className="widget-content">Loading...</div>
    </div>;
  }

  if (error) {
    return <div className="widget-container explorer-maintenance-widget">
      <div className="widget-header">Explorer Maintenance</div>
      <div className="widget-content error">Error: {error}</div>
    </div>;
  }

  if (!data) {
    return <div className="widget-container explorer-maintenance-widget">
      <div className="widget-header">Explorer Maintenance</div>
      <div className="widget-content">No data available</div>
    </div>;
  }

  const getHealthColor = (health: string): "healthy" | "warning" | "critical" => {
    switch (health) {
      case "critical":
        return "critical";
      case "warning":
        return "warning";
      default:
        return "healthy";
    }
  };

  const getTaskStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      pending: "⏳",
      running: "🔄",
      completed: "✓",
      failed: "✗",
    };
    return icons[status] || "?";
  };

  const getGitStatusColor = (status: string) => {
    switch (status) {
      case "clean":
        return "healthy";
      case "dirty":
        return "warning";
      case "ahead":
        return "info";
      case "behind":
        return "warning";
      default:
        return "unknown";
    }
  };

  return (
    <div className="widget-container explorer-maintenance-widget">
      <div className="widget-header">
        <span className="widget-title">Explorer Maintenance</span>
        <span className="widget-timestamp">Updated {lastUpdate?.toLocaleTimeString()}</span>
      </div>

      <div className="widget-content">
        {/* File System Health */}
        <div className="explorer-section">
          <div className="section-title">File System Health</div>
          <div className={`health-badge ${getHealthColor(data.fileSystemHealth)}`}>
            {data.fileSystemHealth.toUpperCase()}
          </div>
        </div>

        {/* Disk Usage */}
        <div className="explorer-section">
          <div className="section-title">Disk Usage</div>
          <div className="metric-row">
            <div className="metric-label">Total</div>
            <div className="metric-bar-container">
              <div className={`metric-bar ${data.diskUsagePercent > 90 ? "critical" : data.diskUsagePercent > 75 ? "warning" : "healthy"}`} 
                   style={{ width: `${Math.min(data.diskUsagePercent, 100)}%` }}></div>
            </div>
            <div className="metric-value">
              {data.diskUsagePercent.toFixed(1)}% ({data.diskUsageGb.toFixed(1)}/{data.diskTotalGb.toFixed(1)} GB)
            </div>
          </div>
          <div className="file-counts">
            <span>{data.fileCount} files</span>
            <span>{data.directoryCount} directories</span>
          </div>
        </div>

        {/* Largest Directories */}
        {data.largestDirectories.length > 0 && (
          <div className="explorer-section">
            <div className="section-title">Largest Directories</div>
            <div className="directories-list">
              {data.largestDirectories.slice(0, 4).map((dir, idx) => (
                <div
                  key={idx}
                  className="directory-item"
                  onClick={() => setExpandedDirectory(expandedDirectory === idx ? null : idx)}
                >
                  <div className="dir-header">
                    <span className="dir-name">{dir.name}</span>
                    <span className="dir-size">{dir.sizeGb.toFixed(2)} GB</span>
                  </div>
                  {expandedDirectory === idx && (
                    <div className="dir-detail">
                      <span className="file-count">{dir.fileCount} files</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache Sizes */}
        {data.cacheSize.length > 0 && (
          <div className="explorer-section">
            <div className="section-title">Cache Sizes</div>
            <div className="cache-grid">
              {data.cacheSize.map((cache, idx) => (
                <div key={idx} className="cache-item">
                  <span className="cache-name">{cache.name}</span>
                  <span className="cache-size">{cache.sizeGb.toFixed(2)} GB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Git Repository Status */}
        {Object.keys(data.gitStatus).length > 0 && (
          <div className="explorer-section">
            <div className="section-title">Git Repositories</div>
            <div className="git-status-grid">
              {Object.entries(data.gitStatus).map(([repo, status]) => (
                <div key={repo} className={`git-item ${getGitStatusColor(status.status)}`}>
                  <span className="git-name">{repo}</span>
                  <span className="git-status">{status.status}</span>
                  {status.files && <span className="file-count">({status.files} files)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance Tasks */}
        {data.maintenanceTasks.length > 0 && (
          <div className="explorer-section">
            <div className="section-title">Maintenance Tasks</div>
            <div className="tasks-list">
              {data.maintenanceTasks.map((task) => (
                <div key={task.id} className={`task-item ${task.status}`}>
                  <div className="task-header">
                    <span className="task-icon">{getTaskStatusIcon(task.status)}</span>
                    <span className="task-name">{task.name}</span>
                    <span className={`task-status ${task.status}`}>{task.status}</span>
                  </div>
                  <div className="task-times">
                    {task.lastRun && <span className="last-run">Last: {new Date(task.lastRun).toLocaleDateString()}</span>}
                    {task.nextScheduled && <span className="next-run">Next: {new Date(task.nextScheduled).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backup Status */}
        <div className="explorer-section">
          <div className="section-title">Backup Status</div>
          <div className={`backup-item ${data.backupStatus.status}`}>
            <span className={`backup-status ${data.backupStatus.status}`}>
              {data.backupStatus.status === "ok" ? "✓" : data.backupStatus.status === "overdue" ? "⚠️" : "✗"}
            </span>
            <span className="backup-time">Last backup: {new Date(data.backupStatus.lastBackup).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Recommended Actions */}
        {data.recommendedActions.length > 0 && (
          <div className="explorer-section recommended">
            <div className="section-title">📋 Recommended Actions</div>
            <div className="actions-list">
              {data.recommendedActions.slice(0, 4).map((action, idx) => (
                <div key={idx} className="action-item">
                  • {action}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorerMaintenanceWidget;
