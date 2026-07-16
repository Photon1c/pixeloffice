import { useState, useEffect, useRef } from "react";

interface GenealogyNode {
  id: string;
  name: string;
  generation: number;
  children: string[];
  parents: string[];
}

interface GenealogyTree {
  nodes: Record<string, GenealogyNode>;
  rootIds: string[];
}

interface Branch {
  branchId: string;
  branchName: string;
  size: number;
  depth: number;
}

interface ResearchResult {
  branchId: string;
  branchName: string;
  difficulty: "easy" | "medium" | "hard";
  searchResults: string[];
  recommendation: string;
  sources: string[];
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  person: string;
  type: "sighting" | "incident" | "interview" | "evidence" | "note";
}

interface EvidenceItem {
  id: string;
  name: string;
  type: "physical" | "digital" | "testimony" | "document" | "other";
  status: "collected" | "analyzed" | "pending" | "submitted";
  description: string;
  tags: string[];
}

interface CaseNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  pinned: boolean;
}

interface CriminologyLabProps {
  onNavigate?: (view: string) => void;
}

type LabTab = "tree" | "timeline" | "evidence" | "notes";

const DEFAULT_MERMAID = `graph TD
    A[John Smith] --> B[William Smith]
    A --> C[Mary Johnson]
    B --> D[Thomas Smith]
    B --> E[Jane Doe]
    C --> F[Robert Johnson]
    C --> G[Sarah Williams]`;

const TAB_LABELS: Record<LabTab, { label: string; icon: string; color: string }> = {
  tree: { label: "Family Tree", icon: "🧬", color: "#06b6d4" },
  timeline: { label: "Suspect Timeline", icon: "⏱", color: "#f59e0b" },
  evidence: { label: "Evidence Board", icon: "📋", color: "#22c55e" },
  notes: { label: "Case Notes", icon: "📝", color: "#8b5cf6" },
};

const EVIDENCE_TYPES: EvidenceItem["type"][] = ["physical", "digital", "testimony", "document", "other"];
const EVIDENCE_STATUSES: EvidenceItem["status"][] = ["collected", "analyzed", "pending", "submitted"];

function AsciiProgressBar({ progress, label }: { progress: number; label: string }) {
  const barWidth = 30;
  const filled = Math.round((progress / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
      color: "#4ecdc4",
      lineHeight: "1.8",
      whiteSpace: "pre",
    }}>
      <div style={{ color: "#94a3b8", marginBottom: "4px" }}>{label}</div>
      <div>[{bar}] {progress}%</div>
    </div>
  );
}

function AnimatedAsciiLoader({ steps }: { steps: string[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (currentStep >= steps.length) return;
    const stepTimer = setInterval(() => {
      setDots(prev => (prev.length >= 5 ? "" : prev + "."));
    }, 300);
    const advanceTimer = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }, 2000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(advanceTimer);
    };
  }, [currentStep, steps.length]);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
      color: "#4ecdc4",
      lineHeight: "2",
      whiteSpace: "pre",
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          color: i < currentStep ? "#22c55e" : i === currentStep ? "#4ecdc4" : "#334155",
          opacity: i > currentStep ? 0.4 : 1,
        }}>
          {i < currentStep ? "✓" : i === currentStep ? "▶" : " "} {step}{i === currentStep ? dots : ""}
        </div>
      ))}
      {currentStep >= steps.length && (
        <div style={{ color: "#22c55e", marginTop: "8px" }}>✓ Complete</div>
      )}
    </div>
  );
}

export default function CriminologyLab({ onNavigate }: CriminologyLabProps) {
  const [activeTab, setActiveTab] = useState<LabTab>("tree");
  const [showLoading, setShowLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState("Initializing Criminology Lab...");

  const [mermaidCode, setMermaidCode] = useState(DEFAULT_MERMAID);
  const [tree, setTree] = useState<GenealogyTree | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [recommended, setRecommended] = useState<ResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchSteps, setResearchSteps] = useState<string[]>([]);
  const [researchProgress, setResearchProgress] = useState(0);
  const [showResearchLoader, setShowResearchLoader] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ date: "", title: "", description: "", person: "", type: "sighting" as TimelineEvent["type"] });

  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [newEvidence, setNewEvidence] = useState({ name: "", type: "physical" as EvidenceItem["type"], description: "", tags: "" });

  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [parseSteps, setParseSteps] = useState<string[]>([]);
  const [showParseLoader, setShowParseLoader] = useState(false);

  useEffect(() => {
    const steps = [
      "Mounting case files...",
      "Loading forensic modules...",
      "Initializing evidence database...",
      "Calibrating analysis tools...",
      "Ready",
    ];
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setLoadingProgress(Math.min(Math.round((current / steps.length) * 100), 100));
      setLoadingLabel(steps[Math.min(current, steps.length - 1)]);
      if (current >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setShowLoading(false), 400);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "tree" && mermaidRef.current && tree) {
      renderMermaid();
    }
  }, [activeTab, tree]);

  const renderMermaid = async () => {
    if (!mermaidRef.current) return;
    try {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
      mermaidRef.current.innerHTML = "";
      const { svg } = await mermaid.render("genealogy-diagram", mermaidCode);
      mermaidRef.current.innerHTML = svg;
    } catch (error) {
      console.error("Mermaid render error:", error);
    }
  };

  const parseTree = async () => {
    setShowParseLoader(true);
    setParseSteps(["Parsing Mermaid diagram...", "Detecting family branches...", "Computing generational depth...", "Building tree structure..."]);
    let progress = 0;
    const progInterval = setInterval(() => {
      progress = Math.min(progress + 8, 90);
    }, 200);
    try {
      const response = await fetch("/api/criminology/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: mermaidCode }),
      });
      const data = await response.json();
      clearInterval(progInterval);
      if (data.success) {
        setParseSteps(prev => [...prev.slice(0, -1), "✓ Tree parsed successfully"]);
        setTree(data.tree);
        setBranches(data.branches);
        setTimeout(() => {
          setActiveTab("tree");
          setShowParseLoader(false);
        }, 500);
      } else {
        setParseSteps(prev => [...prev.slice(0, -1), "✗ Parse failed"]);
        setTimeout(() => setShowParseLoader(false), 1000);
      }
    } catch {
      clearInterval(progInterval);
      setParseSteps(prev => [...prev.slice(0, -1), "✗ Connection error"]);
      setTimeout(() => setShowParseLoader(false), 1000);
    }
  };

  const runResearch = async () => {
    setIsResearching(true);
    setShowResearchLoader(true);
    setResearchProgress(0);
    setResearchSteps(["Initiating branch analysis...", "Querying genealogical databases...", "Cross-referencing records...", "Ranking research difficulty...", "Compiling results..."]);
    const progInterval = setInterval(() => {
      setResearchProgress(prev => Math.min(prev + 5, 90));
    }, 300);
    try {
      const response = await fetch("/api/criminology/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchIds: selectedBranches }),
      });
      const data = await response.json();
      clearInterval(progInterval);
      setResearchProgress(100);
      setResearchSteps(prev => [...prev.slice(0, -1), "✓ Analysis complete"]);
      if (data.success) {
        setResults(data.results);
        setRecommended(data.recommended);
        setTimeout(() => {
          setActiveTab("tree");
          setShowResearchLoader(false);
        }, 600);
      } else {
        setTimeout(() => setShowResearchLoader(false), 1000);
      }
    } catch {
      clearInterval(progInterval);
      setResearchSteps(prev => [...prev.slice(0, -1), "✗ Research failed"]);
      setTimeout(() => setShowResearchLoader(false), 1000);
    } finally {
      setIsResearching(false);
    }
  };

  const addTimelineEvent = () => {
    if (!newEvent.date || !newEvent.title) return;
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      ...newEvent,
    };
    setTimelineEvents(prev => [...prev, event].sort((a, b) => a.date.localeCompare(b.date)));
    setNewEvent({ date: "", title: "", description: "", person: "", type: "sighting" });
  };

  const removeTimelineEvent = (id: string) => {
    setTimelineEvents(prev => prev.filter(e => e.id !== id));
  };

  const addEvidence = () => {
    if (!newEvidence.name) return;
    const item: EvidenceItem = {
      id: `evt-${Date.now()}`,
      name: newEvidence.name,
      type: newEvidence.type,
      status: "collected",
      description: newEvidence.description,
      tags: newEvidence.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    setEvidenceItems(prev => [...prev, item]);
    setNewEvidence({ name: "", type: "physical", description: "", tags: "" });
  };

  const toggleEvidenceStatus = (id: string) => {
    setEvidenceItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const idx = EVIDENCE_STATUSES.indexOf(item.status);
      return { ...item, status: EVIDENCE_STATUSES[(idx + 1) % EVIDENCE_STATUSES.length] };
    }));
  };

  const removeEvidence = (id: string) => {
    setEvidenceItems(prev => prev.filter(e => e.id !== id));
  };

  const addNote = () => {
    if (!noteTitle || !noteContent) return;
    const note: CaseNote = {
      id: `note-${Date.now()}`,
      title: noteTitle,
      content: noteContent,
      createdAt: new Date().toLocaleString(),
      pinned: false,
    };
    setCaseNotes(prev => [note, ...prev]);
    setNoteTitle("");
    setNoteContent("");
  };

  const togglePinNote = (id: string) => {
    setCaseNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const deleteNote = (id: string) => {
    setCaseNotes(prev => prev.filter(n => n.id !== id));
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranches(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "#22c55e";
      case "medium": return "#eab308";
      case "hard": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getEventTypeColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "sighting": return "#06b6d4";
      case "incident": return "#ef4444";
      case "interview": return "#8b5cf6";
      case "evidence": return "#22c55e";
      case "note": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const getEvidenceTypeIcon = (type: EvidenceItem["type"]) => {
    switch (type) {
      case "physical": return "🔬";
      case "digital": return "💻";
      case "testimony": return "🗣";
      case "document": return "📄";
      case "other": return "📦";
    }
  };

  const getEvidenceStatusColor = (status: EvidenceItem["status"]) => {
    switch (status) {
      case "collected": return "#06b6d4";
      case "analyzed": return "#22c55e";
      case "pending": return "#f59e0b";
      case "submitted": return "#8b5cf6";
    }
  };

  const sectionCard = (children: React.ReactNode) => (
    <div style={{
      background: "#1e293b",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #334155",
    }}>
      {children}
    </div>
  );

  const textArea = (value: string, onChange: (v: string) => void, placeholder: string, height = "100px") => (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        height,
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        color: "#e2e8f0",
        padding: "12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
        resize: "vertical",
      }}
      placeholder={placeholder}
    />
  );

  const inputField = (value: string, onChange: (v: string) => void, placeholder: string, width = "100%") => (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width,
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "6px",
        color: "#e2e8f0",
        padding: "10px 12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
      }}
      placeholder={placeholder}
    />
  );

  const pill = (text: string, color: string, bg = "#1e293b") => (
    <span style={{
      background: `${color}20`,
      color,
      padding: "3px 10px",
      borderRadius: "10px",
      fontSize: "11px",
      fontWeight: "600",
    }}>
      {text}
    </span>
  );

  if (showLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        gap: "32px",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>🕵️</div>
        <div style={{
          fontSize: "24px",
          fontWeight: "bold",
          background: "linear-gradient(90deg, #06b6d4, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Criminology Lab
        </div>
        <AsciiProgressBar progress={loadingProgress} label={loadingLabel} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
      color: "#e2e8f0",
      padding: "20px",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Loading overlays */}
      {showParseLoader && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 5, 9, 0.92)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 1000, gap: "24px",
        }}>
          <div style={{ fontSize: "36px" }}>🧬</div>
          <AnimatedAsciiLoader steps={parseSteps} />
        </div>
      )}

      {showResearchLoader && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 5, 9, 0.92)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 1000, gap: "24px",
        }}>
          <div style={{ fontSize: "36px" }}>🔬</div>
          <AnimatedAsciiLoader steps={researchSteps} />
          <AsciiProgressBar progress={researchProgress} label="Research progress" />
        </div>
      )}

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          borderBottom: "1px solid #334155",
          paddingBottom: "16px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{
                fontSize: "2rem",
                fontWeight: "bold",
                background: "linear-gradient(90deg, #06b6d4, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}>
                🕵️ Criminology Lab
              </h1>
              {pill("v2.0", "#4ecdc4")}
            </div>
            <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: "14px" }}>
              Forensic analysis toolkit — family trees, timelines, evidence & case management
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("main")}
              style={{
                background: "#334155",
                border: "none",
                color: "#e2e8f0",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ← Back to Office
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {(Object.entries(TAB_LABELS) as [LabTab, typeof TAB_LABELS[LabTab]][]).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: activeTab === key ? tab.color : "#1e293b",
                border: `1px solid ${activeTab === key ? tab.color : "#334155"}`,
                color: activeTab === key ? "#0f172a" : "#94a3b8",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ===== TAB: FAMILY TREE ===== */}
        {activeTab === "tree" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#06b6d4", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    🧬 Family Tree Input
                  </h3>
                  <textarea
                    value={mermaidCode}
                    onChange={e => setMermaidCode(e.target.value)}
                    style={{
                      width: "100%",
                      height: "360px",
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                      padding: "16px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                    placeholder="Enter Mermaid.js graph definition..."
                  />
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button
                      onClick={parseTree}
                      style={{
                        background: "linear-gradient(90deg, #06b6d4, #0891b2)",
                        border: "none",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        flex: 1,
                      }}
                    >
                      🔍 Parse & Build Tree
                    </button>
                    <button
                      onClick={() => setMermaidCode(DEFAULT_MERMAID)}
                      style={{
                        background: "#334155",
                        border: "none",
                        color: "#94a3b8",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}

              {branches.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  {sectionCard(
                    <>
                      <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#8b5cf6", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        🌿 Detected Branches
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {branches.map((branch, index) => (
                          <div
                            key={branch.branchId}
                            onClick={() => toggleBranchSelection(branch.branchId)}
                            style={{
                              background: selectedBranches.includes(branch.branchId) ? "#1e3a5f" : "#0f172a",
                              border: selectedBranches.includes(branch.branchId) ? "2px solid #06b6d4" : "1px solid #334155",
                              borderRadius: "8px",
                              padding: "14px",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: "600", color: "#e2e8f0" }}>
                                {index + 1}. {branch.branchName}
                              </span>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {pill(`${branch.size} nodes`, "#64748b")}
                                {pill(`depth ${branch.depth}`, "#64748b")}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={runResearch}
                          disabled={isResearching || selectedBranches.length === 0}
                          style={{
                            background: isResearching ? "#334155" : "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                            border: "none",
                            color: "white",
                            padding: "14px 24px",
                            borderRadius: "8px",
                            cursor: isResearching ? "not-allowed" : "pointer",
                            fontSize: "15px",
                            fontWeight: "600",
                            marginTop: "8px",
                            opacity: isResearching ? 0.6 : 1,
                          }}
                        >
                          {isResearching ? "🔬 Processing..." : "🚀 Run Branch Analysis"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: visualization + results */}
            <div>
              {results.length > 0 ? (
                <>
                  {recommended && (
                    <div style={{
                      background: "linear-gradient(135deg, #065f46, #047857)",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "2px solid #10b981",
                      marginBottom: "16px",
                    }}>
                      <h3 style={{ marginTop: 0, color: "#6ee7b7", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                        ⭐ Recommended Lead
                      </h3>
                      <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "6px" }}>
                        {recommended.branchName}
                      </div>
                      {pill(recommended.difficulty.toUpperCase(), getDifficultyColor(recommended.difficulty), `${getDifficultyColor(recommended.difficulty)}20`)}
                      <p style={{ color: "#a7f3d0", margin: "12px 0 0 0", fontSize: "13px" }}>
                        {recommended.recommendation}
                      </p>
                    </div>
                  )}

                  {sectionCard(
                    <>
                      <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#06b6d4", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        📊 Research Results
                      </h3>
                      {results.map((result, index) => (
                        <div key={result.branchId} style={{
                          background: "#0f172a",
                          borderRadius: "8px",
                          padding: "16px",
                          marginBottom: "12px",
                          border: index === 0 ? "2px solid #10b981" : "1px solid #334155",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontWeight: "600" }}>#{index + 1} {result.branchName}</span>
                            {pill(result.difficulty.toUpperCase(), getDifficultyColor(result.difficulty))}
                          </div>
                          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 8px 0" }}>{result.recommendation}</p>
                          {result.searchResults.length > 0 && (
                            <div>
                              <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", marginBottom: "4px" }}>References</div>
                              <ul style={{ color: "#94a3b8", fontSize: "12px", paddingLeft: "16px", margin: 0 }}>
                                {result.searchResults.map((sr, i) => <li key={i} style={{ marginBottom: "2px" }}>{sr}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : tree ? (
                <div>
                  {sectionCard(
                    <>
                      <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#22c55e", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        🌳 Tree Visualization
                      </h3>
                      <div ref={mermaidRef} style={{ display: "flex", justifyContent: "center", overflow: "auto", padding: "20px" }} />
                    </>
                  )}
                  <div style={{ marginTop: "12px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>
                    Select branches and run analysis to get research results
                  </div>
                </div>
              ) : (
                sectionCard(
                  <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧬</div>
                    <p>Enter a Mermaid.js family tree diagram and click "Parse & Build Tree" to begin</p>
                    <p style={{ fontSize: "12px", marginTop: "8px" }}>
                      Use the format: A[Name] -{'->'} B[Child]
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: SUSPECT TIMELINE ===== */}
        {activeTab === "timeline" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#f59e0b", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ➕ Add Event
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {inputField(newEvent.date, v => setNewEvent(prev => ({ ...prev, date: v })), "Date (e.g. 2024-03-15)")}
                    {inputField(newEvent.title, v => setNewEvent(prev => ({ ...prev, title: v })), "Event title")}
                    {inputField(newEvent.person, v => setNewEvent(prev => ({ ...prev, person: v })), "Person involved")}
                    <select
                      value={newEvent.type}
                      onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value as TimelineEvent["type"] }))}
                      style={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        color: "#e2e8f0",
                        padding: "10px 12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "13px",
                      }}
                    >
                      <option value="sighting">👁 Sighting</option>
                      <option value="incident">🚨 Incident</option>
                      <option value="interview">🗣 Interview</option>
                      <option value="evidence">🔬 Evidence</option>
                      <option value="note">📝 Note</option>
                    </select>
                    {textArea(newEvent.description, v => setNewEvent(prev => ({ ...prev, description: v })), "Description", "80px")}
                    <button
                      onClick={addTimelineEvent}
                      disabled={!newEvent.date || !newEvent.title}
                      style={{
                        background: !newEvent.date || !newEvent.title ? "#334155" : "linear-gradient(90deg, #f59e0b, #d97706)",
                        border: "none",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: !newEvent.date || !newEvent.title ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: !newEvent.date || !newEvent.title ? 0.5 : 1,
                      }}
                    >
                      Add to Timeline
                    </button>
                  </div>
                </>
              )}
            </div>

            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#f59e0b", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ⏱ Timeline ({timelineEvents.length} events)
                  </h3>
                  {timelineEvents.length === 0 ? (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏱</div>
                      <p>No events yet. Add dates, sightings, and incidents to build a suspect timeline.</p>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <div style={{
                        position: "absolute",
                        left: "16px",
                        top: "0",
                        bottom: "0",
                        width: "2px",
                        background: "#334155",
                      }} />
                      {timelineEvents.map(event => (
                        <div key={event.id} style={{
                          display: "flex",
                          gap: "16px",
                          marginBottom: "16px",
                          position: "relative",
                        }}>
                          <div style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: getEventTypeColor(event.type),
                            marginTop: "6px",
                            flexShrink: 0,
                            zIndex: 1,
                            boxShadow: `0 0 8px ${getEventTypeColor(event.type)}`,
                          }} />
                          <div style={{
                            flex: 1,
                            background: "#0f172a",
                            borderRadius: "8px",
                            padding: "14px",
                            border: "1px solid #334155",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                                  {pill(event.date, getEventTypeColor(event.type))}
                                  {event.person && pill(event.person, "#64748b")}
                                </div>
                                <div style={{ fontWeight: "600", marginBottom: "4px" }}>{event.title}</div>
                                {event.description && <div style={{ color: "#94a3b8", fontSize: "13px" }}>{event.description}</div>}
                              </div>
                              <button
                                onClick={() => removeTimelineEvent(event.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  padding: "4px",
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: EVIDENCE BOARD ===== */}
        {activeTab === "evidence" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#22c55e", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ➕ Add Evidence
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {inputField(newEvidence.name, v => setNewEvidence(prev => ({ ...prev, name: v })), "Evidence name")}
                    <select
                      value={newEvidence.type}
                      onChange={e => setNewEvidence(prev => ({ ...prev, type: e.target.value as EvidenceItem["type"] }))}
                      style={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        color: "#e2e8f0",
                        padding: "10px 12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "13px",
                      }}
                    >
                      <option value="physical">🔬 Physical</option>
                      <option value="digital">💻 Digital</option>
                      <option value="testimony">🗣 Testimony</option>
                      <option value="document">📄 Document</option>
                      <option value="other">📦 Other</option>
                    </select>
                    {textArea(newEvidence.description, v => setNewEvidence(prev => ({ ...prev, description: v })), "Description", "80px")}
                    {inputField(newEvidence.tags, v => setNewEvidence(prev => ({ ...prev, tags: v })), "Tags (comma separated)")}
                    <button
                      onClick={addEvidence}
                      disabled={!newEvidence.name}
                      style={{
                        background: !newEvidence.name ? "#334155" : "linear-gradient(90deg, #22c55e, #16a34a)",
                        border: "none",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: !newEvidence.name ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: !newEvidence.name ? 0.5 : 1,
                      }}
                    >
                      Register Evidence
                    </button>
                  </div>
                </>
              )}
            </div>

            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#22c55e", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    📋 Evidence Items ({evidenceItems.length})
                  </h3>
                  {evidenceItems.length === 0 ? (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                      <p>No evidence recorded. Log physical, digital, and documentary evidence here.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {evidenceItems.map(item => (
                        <div key={item.id} style={{
                          background: "#0f172a",
                          borderRadius: "8px",
                          padding: "16px",
                          border: "1px solid #334155",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "20px" }}>{getEvidenceTypeIcon(item.type)}</span>
                              <div>
                                <div style={{ fontWeight: "600", marginBottom: "2px" }}>{item.name}</div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  {pill(item.type, "#64748b")}
                                  {item.tags.map(tag => pill(tag, "#8b5cf6"))}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button
                                onClick={() => toggleEvidenceStatus(item.id)}
                                style={{
                                  background: `${getEvidenceStatusColor(item.status)}20`,
                                  border: `1px solid ${getEvidenceStatusColor(item.status)}`,
                                  color: getEvidenceStatusColor(item.status),
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                }}
                              >
                                {item.status}
                              </button>
                              <button
                                onClick={() => removeEvidence(item.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  padding: "4px",
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          {item.description && (
                            <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px" }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: CASE NOTES ===== */}
        {activeTab === "notes" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#8b5cf6", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ➕ New Note
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {inputField(noteTitle, setNoteTitle, "Note title")}
                    {textArea(noteContent, setNoteContent, "Write your case notes here...", "200px")}
                    <button
                      onClick={addNote}
                      disabled={!noteTitle || !noteContent}
                      style={{
                        background: !noteTitle || !noteContent ? "#334155" : "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                        border: "none",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: !noteTitle || !noteContent ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: !noteTitle || !noteContent ? 0.5 : 1,
                      }}
                    >
                      Save Note
                    </button>
                  </div>
                </>
              )}
            </div>

            <div>
              {sectionCard(
                <>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#8b5cf6", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    📝 Case Notes ({caseNotes.length})
                  </h3>
                  {caseNotes.length === 0 ? (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
                      <p>No case notes yet. Start documenting your investigation.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {[...caseNotes].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map(note => (
                        <div key={note.id} style={{
                          background: note.pinned ? "#1e3a5f" : "#0f172a",
                          borderRadius: "8px",
                          padding: "16px",
                          border: note.pinned ? "2px solid #f59e0b" : "1px solid #334155",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                {note.pinned && <span style={{ color: "#f59e0b" }}>📌</span>}
                                <span style={{ fontWeight: "600" }}>{note.title}</span>
                              </div>
                              <div style={{ color: "#94a3b8", fontSize: "13px", whiteSpace: "pre-wrap", marginBottom: "8px" }}>
                                {note.content}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {note.createdAt}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
                              <button
                                onClick={() => togglePinNote(note.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: note.pinned ? "#f59e0b" : "#64748b",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  padding: "4px",
                                }}
                              >
                                📌
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  padding: "4px",
                                }}
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
