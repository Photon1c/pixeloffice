import React, { useState, useEffect } from "react";
import "../styles/infrastructure-widgets.css";

interface VPSHealthData {
  gateway: { up: boolean; latency?: number };
  disk: { percentUsed: number; total: string; used: string };
  cpu: { percentUsed: number };
  ram: { percentUsed: number; total: string; used: string };
  services: { [key: string]: boolean };
  cron: { active: number; total: number };
  ollama: { running: boolean; models: number };
  uptime: { days: number; hours: number; minutes: number };
  devices: { [key: string]: { type: string; status: string } };
  gates: { [key: string]: { status: string; lastSync?: string } };
}

export const VPSHealthWidget: React.FC = () => {
  const [data, setData] = useState<VPSHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/infrastructure/vps-health");
        if (!response.ok) throw new Error("Failed to fetch VPS health");
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

    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // 60s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="widget-container vps-health-widget">
      <div className="widget-header">VPS Health Monitor</div>
      <div className="widget-content">Loading...</div>
    </div>;
  }

  if (error) {
    return <div className="widget-container vps-health-widget">
      <div className="widget-header">VPS Health Monitor</div>
      <div className="widget-content error">Error: {error}</div>
    </div>;
  }

  if (!data) {
    return <div className="widget-container vps-health-widget">
      <div className="widget-header">VPS Health Monitor</div>
      <div className="widget-content">No data available</div>
    </div>;
  }

  const getStatusColor = (value: number, threshold = 80): "healthy" | "warning" | "critical" => {
    if (value < 60) return "healthy";
    if (value < threshold) return "warning";
    return "critical";
  };

  const diskStatus = getStatusColor(data.disk.percentUsed, 85);
  const cpuStatus = getStatusColor(data.cpu.percentUsed, 75);
  const ramStatus = getStatusColor(data.ram.percentUsed, 80);

  const gatewayLatency = data.gateway.latency || 0;
  const gatewayStatus = data.gateway.up ? (gatewayLatency < 100 ? "healthy" : "warning") : "critical";

  return (
    <div className="widget-container vps-health-widget">
      <div className="widget-header">
        <span className="widget-title">VPS Health Monitor</span>
        <span className="widget-timestamp">Updated {lastUpdate?.toLocaleTimeString()}</span>
      </div>

      <div className="widget-content">
        {/* Gateway Status */}
        <div className="vps-section">
          <div className="section-title">Gateway</div>
          <div className="status-row">
            <span className={`status-badge ${gatewayStatus}`}>
              {data.gateway.up ? "✓ UP" : "✗ DOWN"}
            </span>
            {gatewayLatency > 0 && <span className="latency">{gatewayLatency}ms</span>}
          </div>
        </div>

        {/* Resource Metrics */}
        <div className="vps-section">
          <div className="section-title">Resources</div>
          
          <div className="metric-row">
            <div className="metric-label">CPU</div>
            <div className="metric-bar-container">
              <div className={`metric-bar ${cpuStatus}`} style={{ width: `${data.cpu.percentUsed}%` }}></div>
            </div>
            <div className="metric-value">{data.cpu.percentUsed}%</div>
          </div>

          <div className="metric-row">
            <div className="metric-label">RAM</div>
            <div className="metric-bar-container">
              <div className={`metric-bar ${ramStatus}`} style={{ width: `${data.ram.percentUsed}%` }}></div>
            </div>
            <div className="metric-value">{data.ram.percentUsed}% ({data.ram.used}/{data.ram.total})</div>
          </div>

          <div className="metric-row">
            <div className="metric-label">Disk</div>
            <div className="metric-bar-container">
              <div className={`metric-bar ${diskStatus}`} style={{ width: `${data.disk.percentUsed}%` }}></div>
            </div>
            <div className="metric-value">{data.disk.percentUsed}% ({data.disk.used}/{data.disk.total})</div>
          </div>
        </div>

        {/* Uptime */}
        <div className="vps-section">
          <div className="section-title">Uptime</div>
          <div className="uptime-display">
            {data.uptime.days}d {data.uptime.hours}h {data.uptime.minutes}m
          </div>
        </div>

        {/* Ollama Status */}
        <div className="vps-section">
          <div className="section-title">Ollama</div>
          <div className="status-row">
            <span className={`status-badge ${data.ollama.running ? "healthy" : "critical"}`}>
              {data.ollama.running ? "✓ Running" : "✗ Stopped"}
            </span>
            <span className="model-count">{data.ollama.models} models</span>
          </div>
        </div>

        {/* Cron Jobs */}
        <div className="vps-section">
          <div className="section-title">Cron Jobs</div>
          <div className="cron-display">
            {data.cron.active}/{data.cron.total} active
          </div>
        </div>

        {/* Critical Services */}
        {Object.keys(data.services).length > 0 && (
          <div className="vps-section">
            <div className="section-title">Services</div>
            <div className="services-grid">
              {Object.entries(data.services).map(([name, up]) => (
                <div key={name} className={`service-item ${up ? "up" : "down"}`}>
                  <span className="service-name">{name}</span>
                  <span className={`service-status ${up ? "healthy" : "critical"}`}>
                    {up ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gates Status */}
        {Object.keys(data.gates).length > 0 && (
          <div className="vps-section">
            <div className="section-title">Gates</div>
            <div className="gates-grid">
              {Object.entries(data.gates).map(([name, gate]) => (
                <div key={name} className="gate-item">
                  <span className="gate-name">{name}</span>
                  <span className={`gate-status ${gate.status.toLowerCase()}`}>
                    {gate.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VPSHealthWidget;
