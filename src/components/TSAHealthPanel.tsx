import { useState, useEffect, useRef } from "react";

interface WorkflowHealth {
  status: "healthy" | "degraded" | "down";
  timestamp?: string;
}

interface ModelInfo {
  name: string;
  id: string;
  provider: string;
  status: "online" | "lagging" | "offline";
  latency?: number;
  lastCheck: string;
  error?: string;
}

interface AgentInfo {
  id: string;
  name: string;
  models: {
    primary: {
      name: string;
      provider: string;
      status: "local-ready" | "local-unavailable" | "remote" | "unknown";
    };
    fallback?: {
      name: string;
      provider: string;
      status: "remote" | "local-ready" | "local-unavailable";
    };
  };
  status: "active" | "inactive";
  meta: {
    updatedAt: string;
  };
}

interface TSAHealthData {
  workflow: WorkflowHealth;
  models: ModelInfo[];
  agents: AgentInfo[];
}

export interface AgentActivity {
  id: string;
  name: string;
  activity: "thinking" | "speaking" | "acting" | "idle";
  detail?: string;
}

interface TSAHealthPanelProps {
  visible?: boolean;
  pollInterval?: number;
  embedded?: boolean;
  agentActivities?: AgentActivity[];
}

interface PerformanceMetrics {
  fps: number;
  memoryMB: number;
  agentCount: number;
}

const DEFAULT_POLL_INTERVAL = 15000;

export function TSAHealthPanel({
  visible = true,
  pollInterval = DEFAULT_POLL_INTERVAL,
  embedded = false,
  agentActivities,
}: TSAHealthPanelProps) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [healthData, setHealthData] = useState<TSAHealthData>({
    workflow: { status: "healthy" },
    models: [],
    agents: [],
  });
  const [errors, setErrors] = useState<{
    workflow?: string;
    models?: string;
    agents?: string;
  }>({
    workflow: undefined,
    models: undefined,
    agents: undefined,
  });
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryMB: 0,
    agentCount: 0,
  });

  // Performance monitoring
  useEffect(() => {
    if (!visible) return;
    
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    const fpsInterval = 1000; // Calculate FPS every second
    
    const measurePerformance = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastFpsUpdate;
      
      if (elapsed >= fpsInterval) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        const perf = performance as any;
        const memory = perf.memory ? Math.round(perf.memory.usedJSHeapSize / 1048576) : 0;
        
        setPerfMetrics({
          fps,
          memoryMB: memory,
          agentCount: agentActivities?.length || 0,
        });
        
        frameCount = 0;
        lastFpsUpdate = now;
      }
      
      if (visible) {
        requestAnimationFrame(measurePerformance);
      }
    };
    
    const animationFrame = requestAnimationFrame(measurePerformance);
    return () => cancelAnimationFrame(animationFrame);
  }, [visible, agentActivities?.length]);

  const fetchHealthData = async () => {
    try {
      const [workflowRes, modelsRes, agentsRes] = await Promise.all([
        fetch("/api/workflow/health").catch(() => null),
        fetch("/api/models/health").catch(() => null),
        fetch("/handoff/opencode-local-agents.json").catch(() => null),
      ]);

      let workflow: WorkflowHealth = { status: "healthy" };
      let models: ModelInfo[] = [];
      let agents: AgentInfo[] = [];
      let newErrors: typeof errors = {};

      if (workflowRes?.ok) {
        const data = await workflowRes.json();
        workflow = {
          status: data.status || "healthy",
          timestamp: data.timestamp,
        };
      } else {
        newErrors.workflow = workflowRes ? "error" : "unreachable";
      }

      if (modelsRes?.ok) {
        const data = await modelsRes.json();
        models = data.models || [];
      } else {
        newErrors.models = modelsRes ? "error" : "unreachable";
      }

      if (agentsRes?.ok) {
        const data = await agentsRes.json();
        agents = Array.isArray(data) ? data : data.agents || [];
      } else {
        newErrors.agents = agentsRes ? "error" : "unavailable";
      }

      setHealthData({ workflow, models, agents });
      setErrors(newErrors);
      setLastUpdated(Date.now());
    } catch (e) {
      console.warn("[TSAHealthPanel] Fetch error:", e);
    }
  };

  useEffect(() => {
    if (!visible) return;
    fetchHealthData();
    const interval = setInterval(fetchHealthData, pollInterval);
    return () => clearInterval(interval);
  }, [visible, pollInterval]);

  const getOverallStatus = () => {
    const { workflow, models, agents } = healthData;
    const errs = errors || {};

    if (
      errs.workflow === "unreachable" &&
      errs.models === "unreachable" &&
      errs.agents === "unavailable"
    ) {
      return "critical";
    }

    if (
      workflow?.status === "degraded" ||
      workflow?.status === "down" ||
      errs.workflow
    ) {
      return "degraded";
    }

    if (errs.models === "unreachable" && (!models || models.length === 0)) {
      return "degraded";
    }

    if (errs.agents === "unavailable" && (!agents || agents.length === 0)) {
      return "degraded";
    }

    return "healthy";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
      case "local-ready":
      case "active":
        return "#20c997";
      case "degraded":
      case "lagging":
      case "local-unavailable":
        return "#ffc107";
      case "down":
      case "offline":
      case "inactive":
        return "#dc3545";
      case "critical":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const formatTimeSince = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const getModelStatusText = () => {
    const errs = errors;
    const { models } = healthData;
    if (errs.models === "unreachable") return "UNREACHABLE";
    if (errs.models === "error") return "ERROR";
    if (models.length === 0) return "NO MODELS";
    return `${models.length} online`;
  };

  const getAgentStatusText = () => {
    const errs = errors;
    const { agents } = healthData;
    if (errs.agents === "unavailable") return "NO HANDOFF";
    if (errs.agents === "error") return "ERROR";
    if (agents.length === 0) return "No agents";
    const localReady = agents.filter(
      (a) => a.models?.primary?.status === "local-ready",
    ).length;
    return `${localReady}/${agents.length} local`;
  };

  if (!visible) return null;

  const overallStatus = getOverallStatus();
  const statusColor = getStatusColor(overallStatus);
  const pos = embedded ? "relative" : "absolute";
  const topVal = embedded ? 0 : 160;
  const topValExpanded = embedded ? 0 : 120;
  const zIdx = embedded ? 1 : 1000;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: pos as any,
          top: topVal,
          right: 10,
          background: "rgba(0, 0, 0, 0.7)",
          border: `1px solid ${statusColor}`,
          borderRadius: "20px",
          padding: "6px 10px",
          cursor: "pointer",
          zIndex: zIdx,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: embedded ? "8px" : 0,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: statusColor,
          }}
        />
        <span
          style={{
            color: "#6c757d",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          T/S/A
        </span>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => setIsMinimized(true)}
      style={{
        position: pos as any,
        top: topValExpanded,
        right: 10,
        background: "rgba(0, 0, 0, 0.85)",
        border: `1px solid ${statusColor}`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#e9ecef",
        zIndex: zIdx,
        minWidth: "220px",
        backdropFilter: "blur(4px)",
        boxShadow: `0 0 10px ${statusColor}40`,
        marginBottom: embedded ? "8px" : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          borderBottom: "1px solid #495057",
          paddingBottom: "6px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
        <span style={{ fontWeight: "bold", color: statusColor }}>
          {overallStatus.toUpperCase()}
        </span>
        <span style={{ marginLeft: "auto", color: "#6c757d" }}>TSA</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#6c757d",
            cursor: "pointer",
            padding: "0 4px",
            fontSize: "12px",
          }}
        >
          −
        </button>
      </div>

      {/* Performance Metrics */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "4px", padding: "6px", marginBottom: "8px" }}>
        <div style={{ fontSize: "8px", color: "#6c757d", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Performance</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6c757d" }}>FPS</span>
            <span style={{ color: perfMetrics.fps >= 55 ? "#20c997" : perfMetrics.fps >= 30 ? "#ffc107" : "#dc3545", fontWeight: "bold" }}>{perfMetrics.fps}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6c757d" }}>Memory</span>
            <span style={{ color: perfMetrics.memoryMB > 200 ? "#ffc107" : "#20c997", fontWeight: "bold" }}>{perfMetrics.memoryMB || "N/A"}MB</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6c757d" }}>Agents</span>
            <span style={{ color: "#17a2b8", fontWeight: "bold" }}>{perfMetrics.agentCount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6c757d" }}>Render</span>
            <span style={{ color: "#6f42c1", fontWeight: "bold" }}>{perfMetrics.fps > 0 ? Math.round(1000/perfMetrics.fps) : 0}ms</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "4px", marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6c757d" }}>Workflows</span>
          <span
            style={{
              color: getStatusColor(
                errors.workflow === "unreachable"
                  ? "down"
                  : healthData.workflow?.status || "unknown",
              ),
              fontWeight: "bold",
            }}
          >
            {errors.workflow === "unreachable"
              ? "UNREACHABLE"
              : (healthData.workflow?.status || "UNKNOWN").toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6c757d" }}>Ollama</span>
          <span
            style={{
              color: getStatusColor(
                errors.models === "unreachable"
                  ? "offline"
                  : (healthData.models?.length || 0) > 0
                    ? "online"
                    : "offline",
              ),
              fontWeight: "bold",
            }}
          >
            {getModelStatusText()}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6c757d" }}>Agents</span>
          <span style={{ color: statusColor, fontWeight: "bold" }}>
            {getAgentStatusText()}
          </span>
        </div>
      </div>

      {(healthData.agents || []).length > 0 && (
        <div
          style={{
            borderTop: "1px solid #495057",
            paddingTop: "6px",
            marginTop: "6px",
            maxHeight: "120px",
            overflowY: "auto",
          }}
        >
          <div
            style={{ fontSize: "9px", color: "#6c757d", marginBottom: "4px" }}
          >
            Agents (local-ready)
          </div>
          {(healthData.agents || []).slice(0, 8).map((agent) => {
            const primaryStatus = agent.models?.primary?.status || "unknown";
            const isLocal = primaryStatus === "local-ready";
            return (
              <div
                key={agent.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "9px",
                  marginBottom: "2px",
                }}
              >
                <span
                  style={{
                    color: "#bbb",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {agent.name}
                </span>
                <span
                  style={{
                    padding: "1px 4px",
                    borderRadius: "2px",
                    background: getStatusColor(primaryStatus) + "33",
                    color: getStatusColor(primaryStatus),
                    fontSize: "8px",
                  }}
                >
                  {primaryStatus === "local-ready"
                    ? "LOCAL"
                    : primaryStatus === "local-unavailable"
                      ? "LOCAL-DN"
                      : primaryStatus === "remote"
                        ? "REMOTE"
                        : "?"}
                </span>
              </div>
            );
          })}
          {(healthData.agents || []).length > 8 && (
            <div
              style={{ fontSize: "8px", color: "#6c757d", marginTop: "4px" }}
            >
              +{(healthData.agents || []).length - 8} more
            </div>
          )}
        </div>
      )}

      {agentActivities && agentActivities.length > 0 && (
        <div style={{ borderTop: "1px solid #495057", paddingTop: "6px", marginTop: "6px" }}>
          <div style={{ fontSize: "9px", color: "#6c757d", marginBottom: "4px" }}>Agent Activity</div>
          {agentActivities.map((a, idx) => {
            const activityColors: Record<string, string> = {
              thinking: "#feca57",
              speaking: "#20c997",
              acting: "#17a2b8",
              idle: "#6c757d",
            };
            const activityLabels: Record<string, string> = {
              thinking: "💭 thinking",
              speaking: "💬 speaking",
              acting: "⚡ acting",
              idle: "○ idle",
            };
            return (
              <div key={`${a.id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px", fontSize: "9px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activityColors[a.activity], flexShrink: 0 }} />
                <span style={{ color: "#bbb", minWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                <span style={{ color: activityColors[a.activity], fontSize: "8px" }}>{activityLabels[a.activity]}</span>
                {a.detail && <span style={{ color: "#6c757d", fontSize: "7px", marginLeft: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80px" }}>{a.detail}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          fontSize: "8px",
          color: "#6c757d",
          marginTop: "6px",
          paddingTop: "4px",
          borderTop: "1px solid #343a40",
        }}
      >
        Updated {formatTimeSince(lastUpdated)} ago
      </div>
    </div>
  );
}

export default TSAHealthPanel;
