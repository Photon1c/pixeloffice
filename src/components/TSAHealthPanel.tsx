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

interface TSAHealthPanelProps {
  visible?: boolean;
  pollInterval?: number;
}

const DEFAULT_POLL_INTERVAL = 15000;

export function TSAHealthPanel({
  visible = true,
  pollInterval = DEFAULT_POLL_INTERVAL,
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
    const { models, errors: errs } = healthData;
    if (errs.models === "unreachable") return "UNREACHABLE";
    if (errs.models === "error") return "ERROR";
    if (models.length === 0) return "NO MODELS";
    return `${models.length} online`;
  };

  const getAgentStatusText = () => {
    const { agents, errors: errs } = healthData;
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

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: "absolute",
          top: 160,
          right: 10,
          background: "rgba(0, 0, 0, 0.7)",
          border: `1px solid ${statusColor}`,
          borderRadius: "20px",
          padding: "6px 10px",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "6px",
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
        position: "absolute",
        top: 120,
        right: 10,
        background: "rgba(0, 0, 0, 0.85)",
        border: `1px solid ${statusColor}`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#e9ecef",
        zIndex: 1000,
        minWidth: "220px",
        backdropFilter: "blur(4px)",
        boxShadow: `0 0 10px ${statusColor}40`,
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
