import { useEffect, useState } from "react";

const API_BASE = "";

interface AssessmentListItem {
  id: string;
  systemName: string;
  createdAt: string;
  overallDivergenceScore: number;
}

interface ArbiterStatus {
  active: boolean;
  session: any | null;
  currentStage: string | null;
  complete: boolean;
  assessment: any | null;
}

interface AutoRunPayload {
  topic: string;
  systemScope: string;
  systemDescription?: string;
  institutionalContext?: string;
  boundaries?: string[];
  participants?: string[];
  mermaidDiagram?: string;
}

interface AutoRunResult {
  message?: string;
  assessment?: { id: string; systemName: string; overallDivergenceScore: number };
  reportPath?: string;
  error?: string;
}

interface DashboardSummary {
  totalAssessments: number;
  systems: number;
  criticalAssessments: number;
  totalGovernanceDebt: number;
  recentAssessments: Array<{
    id: string;
    systemName: string;
    createdAt: string;
    overallDivergenceScore: number;
  }>;
  dimensionStats: Record<string, { avgScore: number; criticalCount: number }>;
}

interface ActivityLogEntry {
  id: string;
  assessmentId: string;
  stage: string;
  agent: string;
  action: string;
  description: string;
  details?: Record<string, any>;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

const DEFAULT_COMPARATIVE_SYSTEM_SCOPE = "CriticalInfrastructure-Nov2026";
const DEFAULT_COMPARATIVE_TOPIC = "The Retreat of Operational Availability: Governance Debt in Critical Infrastructure";
const DEFAULT_COMPARATIVE_DESCRIPTION =
  "Comparative governance divergence across five critical-infrastructure institutions experiencing November 2026 incidents (Microsoft Outlook Nov 12; FAA Nov 13 ground stop; United Airlines Nov 16; Google Nov 16 autonomous cyberattack findings; NSA Nov 17 internal communications outage). Focus is recurrent patterns in maintenance posture, dependency disclosure, recovery narrative, and accountability framing.";
const DEFAULT_COMPARATIVE_INSTITUTIONAL_CONTEXT =
  "Cross-institutional comparative review of five U.S. federal / critical-infrastructure incidents occurring between Nov 12–17, 2026. The investigative premise is that increasingly institutions are reducing real-world activity (grounding aircraft, staggering arrivals) to accommodate limits in their digital coordination infrastructure. Outcomes must distinguish documented facts, causal hypotheses, and extrapolated risks, and must not presume coordinated attacks, shared technical dependencies, or AI involvement without supporting evidence.";
const DEFAULT_COMPARATIVE_BOUNDARIES = [
  "Configuration-management and maintenance practices across five institutions",
  "Institutional press releases, public statements, and self-reported post-event reports",
  "Independent press (Reuters, AP, Wired) and court-of-record sources (GAO, IG reports)",
  "Industry post-mortems and vendor-published operational reports",
  "Comparative telemetry where institutions disclose time-to-restore or time-to-validate metrics",
];

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "12px",
    background: "#0a0a12",
    border: "1px solid #1b2333",
    borderRadius: "6px",
    marginTop: "4px",
    marginBottom: "12px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#cfd2da",
    fontSize: "11px",
  },
  section: { marginBottom: "10px" },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  input: {
    flex: 1,
    padding: "4px 6px",
    background: "#14161c",
    border: "1px solid #2a2f3a",
    borderRadius: "4px",
    color: "#e3e6ea",
    fontSize: "11px",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "4px 6px",
    background: "#14161c",
    border: "1px solid #2a2f3a",
    borderRadius: "4px",
    color: "#e3e6ea",
    fontSize: "11px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "48px",
  },
  label: {
    color: "#a0a0b0",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "2px",
  },
  btnPrimary: {
    background: "#2657d8",
    color: "#fff",
    fontWeight: 600,
    border: "none",
    borderRadius: "4px",
    padding: "5px 10px",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSecondary: {
    background: "#2a2f3a",
    color: "#cfd2da",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "10px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  metaLine: { fontSize: "10px", color: "#7f8597", marginTop: "4px" },
  pill: {
    display: "inline-block",
    background: "#2a2f3a",
    color: "#cfd2da",
    borderRadius: "10px",
    padding: "1px 6px",
    fontSize: "9px",
    marginRight: "4px",
  },
  pillCritical: { background: "#7a1f1f", color: "#ffd5d5" },
  pillHigh: { background: "#5e4a16", color: "#ffe4ad" },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 6px",
    background: "#14161c",
    borderRadius: "4px",
    marginBottom: "4px",
    border: "1px solid #1b2333",
  },
  listItemOpen: { borderColor: "#2657d8" },
  error: { color: "#f88", background: "#1a0606", padding: "4px 6px", borderRadius: "4px", marginTop: "4px" },
  success: { color: "#7fc77f", background: "#06190a", padding: "4px 6px", borderRadius: "4px", marginTop: "4px" },
  reportsHeader: {
    fontSize: "11px",
    color: "#a0a0b0",
    fontWeight: 600,
    marginTop: "8px",
    marginBottom: "4px",
    borderTop: "1px solid #1b2333",
    paddingTop: "8px",
  },
};

export default function ReflexiveArbiterPanel() {
  const [status, setStatus] = useState<ArbiterStatus | null>(null);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);
  const [loadedReportContent, setLoadedReportContent] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  // Quick-run form state — pre-loaded with the comparative-infrastructure defaults.
  const [topic, setTopic] = useState<string>(DEFAULT_COMPARATIVE_TOPIC);
  const [systemScope, setSystemScope] = useState<string>(DEFAULT_COMPARATIVE_SYSTEM_SCOPE);
  const [mermaidDiagram, setMermaidDiagram] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Admin features state
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);
  const [showMermaid, setShowMermaid] = useState<boolean>(false);
  const [newsTrigger, setNewsTrigger] = useState<{title: string; url: string; source: string; keywords: string}>({
    title: "", url: "", source: "", keywords: ""
  });
  const [triggeringNews, setTriggeringNews] = useState<boolean>(false);

  const refreshStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/arbiter/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      // status is best-effort; don't surface as fatal error
      console.error("Failed to fetch arbiter status:", err);
    }
  };

  const refreshAssessments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/arbiter/assessments`);
      const data = await res.json();
      setAssessments(Array.isArray(data.assessments) ? data.assessments : []);
    } catch (err: any) {
      console.error("Failed to list arbiter assessments:", err);
    }
  };

  useEffect(() => {
    refreshStatus();
    refreshAssessments();
  }, []);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/arbiter/dashboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDashboard(data.summary);
    } catch (err: any) {
      setError(`Failed to load dashboard: ${err?.message ?? err}`);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadActivity = async (id: string) => {
    if (loadingActivity === id) {
      setLoadingActivity(null);
      setActivityLog([]);
      return;
    }
    setLoadingActivity(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/arbiter/assessments/${id}/activity`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActivityLog(data.activityLog || []);
    } catch (err: any) {
      setError(`Failed to load activity: ${err?.message ?? err}`);
    } finally {
      setLoadingActivity(null);
    }
  };

  const downloadEvidencePack = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/arbiter/assessments/${id}/evidence-pack`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-pack-${id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`Evidence pack downloaded for ${id}`);
    } catch (err: any) {
      setError(`Failed to download evidence pack: ${err?.message ?? err}`);
    }
  };

  const handleMermaidRun = async () => {
    if (!topic.trim() || !systemScope.trim() || !mermaidDiagram.trim()) {
      setError("Topic, System Scope, and Mermaid diagram are required.");
      return;
    }
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        topic,
        systemScope,
        systemDescription: DEFAULT_COMPARATIVE_DESCRIPTION,
        institutionalContext: DEFAULT_COMPARATIVE_INSTITUTIONAL_CONTEXT,
        boundaries: DEFAULT_COMPARATIVE_BOUNDARIES,
        participants: ["clerk", "specialist", "executive", "archivist"],
        mermaidDiagram,
      };
      const res = await fetch(`${API_BASE}/api/admin/arbiter/start-with-mermaid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSuccess(`Mermaid-based assessment started: ${data.session?.id ?? "(no id)"} at stage ${data.stageResult?.stage}`);
      await refreshStatus();
      await refreshAssessments();
    } catch (err: any) {
      setError(`Mermaid run failed: ${err?.message ?? err}`);
    } finally {
      setRunning(false);
    }
  };

  const handleNewsTrigger = async () => {
    if (!newsTrigger.title.trim()) {
      setError("News title is required.");
      return;
    }
    if (!status?.assessment?.id) {
      setError("No active assessment to attach news trigger to. Run an assessment first.");
      return;
    }
    setTriggeringNews(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/arbiter/news-trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: status.assessment.id,
          newsTitle: newsTrigger.title,
          newsUrl: newsTrigger.url,
          newsSource: newsTrigger.source || "manual",
          publishedAt: new Date().toISOString(),
          keywords: newsTrigger.keywords.split(",").map(k => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSuccess(`News trigger processed: matched ${data.newsTrigger?.triggeredDimensions?.length ?? 0} dimensions`);
      setNewsTrigger({title: "", url: "", source: "", keywords: ""});
      await refreshStatus();
    } catch (err: any) {
      setError(`News trigger failed: ${err?.message ?? err}`);
    } finally {
      setTriggeringNews(false);
    }
  };

  const loadReport = async (id: string) => {
    if (loadedReportId === id) {
      setLoadedReportId(null);
      setLoadedReportContent(null);
      return;
    }
    setLoadingReport(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/arbiter/assessments/${id}/report`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      setLoadedReportId(id);
      setLoadedReportContent(text);
    } catch (err: any) {
      setError(`Failed to load report: ${err?.message ?? err}`);
    } finally {
      setLoadingReport(null);
    }
  };

  const handleAutoRun = async () => {
    if (!topic.trim() || !systemScope.trim()) {
      setError("Topic and System Scope are required.");
      return;
    }
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: AutoRunPayload = {
        topic,
        systemScope,
        systemDescription: DEFAULT_COMPARATIVE_DESCRIPTION,
        institutionalContext: DEFAULT_COMPARATIVE_INSTITUTIONAL_CONTEXT,
        boundaries: DEFAULT_COMPARATIVE_BOUNDARIES,
        participants: ["clerk", "specialist", "executive", "archivist"],
      };
      const res = await fetch(`${API_BASE}/api/arbiter/auto-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: AutoRunResult = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSuccess(
        `Assessment complete: ${data.assessment?.id ?? "(no id)"} — overall ${(
          (data.assessment?.overallDivergenceScore ?? 0) * 25
        ).toFixed(0)}%/100, report at ${data.reportPath ?? "(unwritten)"}`,
      );
      await refreshStatus();
      await refreshAssessments();
    } catch (err: any) {
      setError(`Auto-run failed: ${err?.message ?? err}`);
    } finally {
      setRunning(false);
    }
  };

  const sorted = [...assessments].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.label}>Status</div>
        <div style={styles.row}>
          <span>
            {status?.active ? (
              <>
                <span style={{ ...styles.pill, ...styles.pillHigh }}>● RUNNING</span>{" "}
                <span style={{ color: "#cfd2da" }}>{status.currentStage ?? "—"}</span>
              </>
            ) : status?.complete ? (
              <span style={styles.pill}>● complete</span>
            ) : (
              <span style={{ color: "#7f8597" }}>idle</span>
            )}
          </span>
          <button
            style={styles.btnSecondary}
            onClick={() => { refreshStatus(); refreshAssessments(); }}
            title="Refresh status and assessment list"
          >
            ↻
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>Quick Run — Nov 2026 Comparative Infrastructure</div>
        <div style={{ ...styles.row, flexDirection: "column", alignItems: "stretch" }}>
          <input
            style={{ ...styles.input, marginBottom: "4px" }}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Assessment topic"
            disabled={running}
            data-testid="arbiter-topic-input"
          />
          <input
            style={styles.input}
            value={systemScope}
            onChange={(e) => setSystemScope(e.target.value)}
            placeholder="system scope (e.g. CriticalInfrastructure-Nov2026)"
            disabled={running}
            data-testid="arbiter-scope-input"
          />
          <button
            style={{
              ...styles.btnPrimary,
              marginTop: "6px",
              ...(running ? styles.btnDisabled : {}),
            }}
            disabled={running}
            onClick={handleAutoRun}
            data-testid="arbiter-auto-run-btn"
          >
            {running ? "Running 7-stage assessment…" : "Run Reflexive Arbiter Assessment"}
          </button>
          <div style={styles.metaLine}>
            Runs the full 7-stage SCRUM with all four participants. Pre-loaded with the
            comparative-infrastructure defaults from{" "}
            <code style={{ color: "#cfd2da" }}>
              scripts/run-infrastructure-governance-assessment.ts
            </code>{" "}
            — system-specific evidence is supplied by the server-side evidence collector.
            KB and LLM may be unavailable; provenance is investigator-tagged.
          </div>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
      </div>

      {/* Admin Dashboard */}
      <div style={styles.section}>
        <div style={styles.row}>
          <div style={styles.label}>Admin Dashboard</div>
          <button
            style={styles.btnSecondary}
            onClick={loadDashboard}
            disabled={loadingDashboard}
            title="Load admin dashboard summary"
          >
            {loadingDashboard ? "⟳" : "↻ Load"}
          </button>
        </div>
        {dashboard && (
          <div style={{ fontSize: "10px", color: "#a0a0b0", marginTop: "4px" }}>
            <div style={styles.row}>
              <span>Total Assessments: <strong>{dashboard.totalAssessments}</strong></span>
              <span>Systems: <strong>{dashboard.systems}</strong></span>
            </div>
            <div style={styles.row}>
              <span>Critical: <strong style={{color: "#ff8888"}}>{dashboard.criticalAssessments}</strong></span>
              <span>Governance Debt: <strong style={{color: "#ffcc88"}}>{dashboard.totalGovernanceDebt}</strong></span>
            </div>
            <div style={{ marginTop: "4px" }}>
              <strong>Dimension Stats:</strong>
              {Object.entries(dashboard.dimensionStats).map(([dim, stats]) => (
                <span key={dim} style={{ ...styles.pill, marginRight: "4px", marginTop: "2px" }}>
                  {dim}: avg {stats.avgScore.toFixed(2)} / crit {stats.criticalCount}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mermaid Diagram Scope */}
      <div style={styles.section}>
        <div style={styles.row}>
          <div style={styles.label}>Mermaid Scope Definition</div>
          <button
            style={styles.btnSecondary}
            onClick={() => setShowMermaid(!showMermaid)}
            title="Toggle Mermaid diagram input"
          >
            {showMermaid ? "▲ Hide" : "▼ Show"}
          </button>
        </div>
        {showMermaid && (
          <div style={{ ...styles.row, flexDirection: "column", alignItems: "stretch" }}>
            <textarea
              style={styles.textarea}
              value={mermaidDiagram}
              onChange={(e) => setMermaidDiagram(e.target.value)}
              placeholder="graph TD&#10;    A[User] --> B[Frontend]&#10;    B --> C[API Gateway]&#10;    C --> D[Auth Service]&#10;    C --> E[Data Service]&#10;    E --> F[(Database)]&#10;    C --> G[External API]"
              disabled={running}
            />
            <button
              style={{
                ...styles.btnPrimary,
                marginTop: "6px",
                ...(running ? styles.btnDisabled : {}),
              }}
              disabled={running}
              onClick={handleMermaidRun}
            >
              {running ? "Running…" : "Run Assessment with Mermaid Scope"}
            </button>
            <div style={styles.metaLine}>
              Define system architecture as a Mermaid diagram. Boundaries are auto-extracted from
              system/component/external nodes. Nodes in [brackets] become labeled elements.
            </div>
          </div>
        )}
      </div>

      {/* News Trigger */}
      <div style={styles.section}>
        <div style={styles.row}>
          <div style={styles.label}>News Evidence Trigger</div>
          <span style={{fontSize: "10px", color: status?.assessment ? "#7fc77f" : "#7f8597"}}>
            {status?.assessment ? `Active: ${status.assessment.id.slice(0, 20)}…` : "No active assessment"}
          </span>
        </div>
        <div style={{ ...styles.row, flexDirection: "column", alignItems: "stretch" }}>
          <input
            style={{ ...styles.input, marginBottom: "4px" }}
            value={newsTrigger.title}
            onChange={(e) => setNewsTrigger({...newsTrigger, title: e.target.value})}
            placeholder="News title (e.g. 'Major outage in payment system')"
            disabled={triggeringNews}
          />
          <input
            style={{ ...styles.input, marginBottom: "4px" }}
            value={newsTrigger.url}
            onChange={(e) => setNewsTrigger({...newsTrigger, url: e.target.value})}
            placeholder="News URL (optional)"
            disabled={triggeringNews}
          />
          <input
            style={{ ...styles.input, marginBottom: "4px" }}
            value={newsTrigger.source}
            onChange={(e) => setNewsTrigger({...newsTrigger, source: e.target.value})}
            placeholder="Source (e.g. TechCrunch, Reuters)"
            disabled={triggeringNews}
          />
          <input
            style={styles.input}
            value={newsTrigger.keywords}
            onChange={(e) => setNewsTrigger({...newsTrigger, keywords: e.target.value})}
            placeholder="Keywords (comma-separated, optional)"
            disabled={triggeringNews}
          />
          <button
            style={{
              ...styles.btnPrimary,
              marginTop: "6px",
              ...(triggeringNews ? styles.btnDisabled : {}),
            }}
            disabled={triggeringNews || !status?.assessment}
            onClick={handleNewsTrigger}
          >
            {triggeringNews ? "Triggering…" : "Trigger Evidence Collection"}
          </button>
          <div style={styles.metaLine}>
            Matches keywords against 6 governance dimensions. Creates evidence records from news content.
            Requires an active assessment to attach triggers to.
          </div>
        </div>
      </div>

      <div style={styles.reportsHeader}>Past Assessments ({sorted.length})</div>
      {sorted.length === 0 && (
        <div style={{ ...styles.metaLine, paddingLeft: "4px" }}>
          No assessments yet. Run one above.
        </div>
      )}
      {sorted.map((a) => {
        const pct = (a.overallDivergenceScore / 4) * 100;
        const critical = a.overallDivergenceScore >= 2.5;
        const high = a.overallDivergenceScore >= 1.5 && a.overallDivergenceScore < 2.5;
        return (
          <div key={a.id}>
            <div
              style={{
                ...styles.listItem,
                ...(loadedReportId === a.id ? styles.listItemOpen : {}),
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#e3e6ea",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={a.systemName}
                >
                  {a.systemName}
                </div>
                <div style={styles.metaLine}>
                  score {a.overallDivergenceScore.toFixed(2)}/4 · {pct.toFixed(0)}%
                </div>
              </div>
              <span
                style={{
                  ...styles.pill,
                  ...(critical ? styles.pillCritical : high ? styles.pillHigh : {}),
                }}
              >
                {critical ? "🔴 critical" : high ? "⚠ high" : "green"}
              </span>
              <button
                style={{
                  ...styles.btnSecondary,
                  marginLeft: "6px",
                  ...(loadingReport === a.id ? styles.btnDisabled : {}),
                }}
                onClick={() => loadReport(a.id)}
                disabled={loadingReport === a.id}
                title={`View report ${a.id}`}
                data-testid={`arbiter-view-report-${a.id}`}
              >
                {loadingReport === a.id ? "…" : loadedReportId === a.id ? "▲" : "View"}
              </button>
              <button
                style={{
                  ...styles.btnSecondary,
                  marginLeft: "4px",
                  ...(loadingActivity === a.id ? styles.btnDisabled : {}),
                }}
                onClick={() => loadActivity(a.id)}
                disabled={loadingActivity === a.id}
                title={`View activity log ${a.id}`}
              >
                {loadingActivity === a.id ? "…" : loadedReportId === a.id ? "📋" : "📋"}
              </button>
              <button
                style={{
                  ...styles.btnSecondary,
                  marginLeft: "4px",
                }}
                onClick={() => downloadEvidencePack(a.id)}
                title={`Download evidence pack ${a.id}`}
              >
                📦
              </button>
            </div>
            {loadedReportId === a.id && loadedReportContent && (
              <pre
                style={{
                  margin: "4px 0 8px 0",
                  padding: "8px",
                  background: "#0d0d14",
                  color: "#bcc0c9",
                  borderRadius: "4px",
                  border: "1px solid #1b2333",
                  fontSize: "10px",
                  lineHeight: "1.4",
                  maxHeight: "260px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {loadedReportContent}
              </pre>
            )}
            {loadingActivity === a.id && (
              <div style={{ margin: "4px 0", padding: "8px", background: "#1a1a2e", borderRadius: "4px", color: "#7f8597" }}>
                Loading activity log…
              </div>
            )}
            {loadedReportId === a.id && activityLog.length > 0 && (
              <div style={{ marginTop: "4px", padding: "8px", background: "#0d0d14", borderRadius: "4px", border: "1px solid #1b2333" }}>
                <div style={{ fontSize: "10px", color: "#a0a0b0", marginBottom: "4px", fontWeight: 600 }}>
                  Activity Log ({activityLog.length} entries)
                </div>
                {activityLog.slice(0, 20).map((entry) => (
                  <div key={entry.id} style={{ fontSize: "9px", color: "#bcc0c9", marginBottom: "2px", fontFamily: "monospace" }}>
                    <span style={{color: "#7f8597"}}>{entry.timestamp.slice(11, 19)}</span>{" "}
                    <span style={{
                      color: entry.severity === "critical" ? "#ff8888" : entry.severity === "warning" ? "#ffcc88" : "#88ccff"
                    }}>
                      [{entry.severity.toUpperCase()}]
                    </span>{" "}
                    <span style={{color: "#a0a0b0"}}>{entry.agent}</span> -{" "}
                    <span>{entry.action}</span>: {entry.description}
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <span style={{color: "#7f8597", marginLeft: "8px"}}>
                        {JSON.stringify(entry.details).slice(0, 100)}…
                      </span>
                    )}
                  </div>
                ))}
                {activityLog.length > 20 && (
                  <div style={{ fontSize: "9px", color: "#7f8597", marginTop: "4px" }}>
                    … and {activityLog.length - 20} more entries
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
