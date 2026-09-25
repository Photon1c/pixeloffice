import React, { useState, useEffect } from "react";
import "../styles/infrastructure-widgets.css";

interface SecurityIncident {
  timestamp: string;
  level: "info" | "low" | "medium" | "high" | "critical";
  category: string;
  description: string;
  source?: string;
  resolved?: boolean;
}

interface SecurityPatrolData {
  lastScan: string;
  scanDuration: number;
  riskLevel: "green" | "yellow" | "orange" | "red";
  totalIncidents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  recentIncidents: SecurityIncident[];
  categories: { [key: string]: number };
  sensitiveEnvVars: number;
  suspiciousPatterns: string[];
}

export const SecurityPatrolWidget: React.FC = () => {
  const [data, setData] = useState<SecurityPatrolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await fetch("/api/infrastructure/security-patrol");
        if (!response.ok) throw new Error("Failed to fetch security patrol data");
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

    fetchSecurity();
    const interval = setInterval(fetchSecurity, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="widget-container security-patrol-widget">
      <div className="widget-header">Security Patrol</div>
      <div className="widget-content">Loading...</div>
    </div>;
  }

  if (error) {
    return <div className="widget-container security-patrol-widget">
      <div className="widget-header">Security Patrol</div>
      <div className="widget-content error">Error: {error}</div>
    </div>;
  }

  if (!data) {
    return <div className="widget-container security-patrol-widget">
      <div className="widget-header">Security Patrol</div>
      <div className="widget-content">No data available</div>
    </div>;
  }

  const getLevelIcon = (level: string) => {
    const icons: { [key: string]: string } = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
      info: "ℹ️",
    };
    return icons[level] || "❓";
  };

  const getRiskColor = (level: string) => {
    const colors: { [key: string]: string } = {
      red: "critical",
      orange: "high",
      yellow: "warning",
      green: "healthy",
    };
    return colors[level] || "unknown";
  };

  return (
    <div className="widget-container security-patrol-widget">
      <div className="widget-header">
        <span className="widget-title">Security Patrol</span>
        <span className="widget-timestamp">Last scan: {lastUpdate?.toLocaleTimeString()}</span>
      </div>

      <div className="widget-content">
        {/* Overall Risk Level */}
        <div className="security-section">
          <div className="section-title">Overall Risk</div>
          <div className={`risk-badge ${getRiskColor(data.riskLevel)}`}>
            {data.riskLevel.toUpperCase()}
          </div>
          <div className="scan-info">
            Scan duration: {data.scanDuration}ms
          </div>
        </div>

        {/* Incident Summary */}
        <div className="security-section">
          <div className="section-title">Incident Summary</div>
          <div className="incident-counts">
            {data.criticalCount > 0 && (
              <div className="count-item critical">
                <span className="count-number">{data.criticalCount}</span>
                <span className="count-label">Critical</span>
              </div>
            )}
            {data.highCount > 0 && (
              <div className="count-item high">
                <span className="count-number">{data.highCount}</span>
                <span className="count-label">High</span>
              </div>
            )}
            {data.mediumCount > 0 && (
              <div className="count-item medium">
                <span className="count-number">{data.mediumCount}</span>
                <span className="count-label">Medium</span>
              </div>
            )}
            {data.lowCount > 0 && (
              <div className="count-item low">
                <span className="count-number">{data.lowCount}</span>
                <span className="count-label">Low</span>
              </div>
            )}
            {data.infoCount > 0 && (
              <div className="count-item info">
                <span className="count-number">{data.infoCount}</span>
                <span className="count-label">Info</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        {data.recentIncidents.length > 0 && (
          <div className="security-section">
            <div className="section-title">Recent Incidents</div>
            <div className="incidents-list">
              {data.recentIncidents.slice(0, 5).map((incident, idx) => (
                <div
                  key={idx}
                  className={`incident-item ${incident.level} ${expandedIncident === idx ? "expanded" : ""}`}
                  onClick={() => setExpandedIncident(expandedIncident === idx ? null : idx)}
                >
                  <div className="incident-header">
                    <span className="incident-icon">{getLevelIcon(incident.level)}</span>
                    <span className="incident-category">{incident.category}</span>
                    <span className="incident-time">
                      {new Date(incident.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {expandedIncident === idx && (
                    <div className="incident-detail">
                      <p>{incident.description}</p>
                      {incident.source && <p className="source">Source: {incident.source}</p>}
                      {incident.resolved && <p className="resolved">✓ Resolved</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incident Categories */}
        {Object.keys(data.categories).length > 0 && (
          <div className="security-section">
            <div className="section-title">Incident Categories</div>
            <div className="categories-grid">
              {Object.entries(data.categories).map(([category, count]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suspicious Patterns */}
        {data.suspiciousPatterns.length > 0 && (
          <div className="security-section suspicious">
            <div className="section-title">⚠️ Suspicious Patterns</div>
            <div className="patterns-list">
              {data.suspiciousPatterns.slice(0, 3).map((pattern, idx) => (
                <div key={idx} className="pattern-item">
                  • {pattern}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensitive Environment Variables */}
        {data.sensitiveEnvVars > 0 && (
          <div className="security-section warning">
            <div className="section-title">⚠️ Sensitive Env Vars</div>
            <div className="env-vars-count">
              {data.sensitiveEnvVars} variable(s) detected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPatrolWidget;
