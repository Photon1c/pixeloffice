import { useState, useRef, useEffect } from "react";

export interface InventoryWorkflowStep {
  id: string;
  label: string;
  type: "input" | "perception" | "auto" | "exception" | "router" | "review" | "output";
  status: "pending" | "active" | "completed";
}

export interface InventoryWorkflowDemoProps {
  onComplete?: () => void;
}

const INITIAL_WORKFLOW: InventoryWorkflowStep[] = [
  {
    id: "scan-start",
    label: "Inventory Scan",
    type: "input",
    status: "pending"
  },
  {
    id: "bulk-detect",
    label: "Bulk Detect Objects",
    type: "perception",
    status: "pending"
  },
  {
    id: "confidence-split",
    label: "Confidence Split",
    type: "router",
    status: "pending"
  },
  {
    id: "known-sku",
    label: "Known SKU",
    type: "auto",
    status: "pending"
  },
  {
    id: "ambiguous-item",
    label: "Ambiguous Item",
    type: "exception",
    status: "pending"
  },
  {
    id: "route-review",
    label: "Route to Review",
    type: "router",
    status: "pending"
  },
  {
    id: "verify",
    label: "Human / Agent Verify",
    type: "review",
    status: "pending"
  },
  {
    id: "inventory-log",
    label: "Inventory Log / Done",
    type: "output",
    status: "pending"
  }
];

const WORKFLOW_LOG_MESSAGES = [
  "Inventory workflow test running...",
  "Scanning shelf state...",
  "Detected 6 known SKUs.",
  "Detected 2 ambiguous items.",
  "Routing ambiguous items to review.",
  "Verification complete.",
  "Inventory state updated."
];

export function InventoryWorkflowDemo({ onComplete }: InventoryWorkflowDemoProps) {
  const [workflow, setWorkflow] = useState<InventoryWorkflowStep[]>(INITIAL_WORKFLOW);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const animationRefs = useRef<NodeJS.Timeout[]>([]);
  const stepIndexRef = useRef(0);

  const getStatusColor = (step: InventoryWorkflowStep) => {
    switch (step.type) {
      case "exception":
        return step.status === "active" ? "#ff6b6b" : step.status === "completed" ? "#ff8787" : "#2a2a3a";
      case "router":
        return step.status === "active" ? "#feca57" : step.status === "completed" ? "#ffeaa7" : "#2a2a3a";
      case "review":
        return step.status === "active" ? "#4ecdc4" : step.status === "completed" ? "#7ed6df" : "#2a2a3a";
      case "auto":
        return step.status === "active" ? "#26de81" : step.status === "completed" ? "#7bed9f" : "#2a2a3a";
      default:
        return step.status === "active" ? "#a55eea" : step.status === "completed" ? "#d980fa" : "#2a2a3a";
    }
  };

  const getStepIcon = (step: InventoryWorkflowStep) => {
    switch (step.type) {
      case "input": return "📥";
      case "perception": return "👁️";
      case "auto": return "⚙️";
      case "exception": return "⚠️";
      case "router": return "🔀";
      case "review": return "👤";
      case "output": return "📤";
      default: return "📍";
    }
  };

  const addLogMessage = (message: string) => {
    setLogMessages(prev => [...prev, message].slice(-7));
  };

  const runAnimation = () => {
    const sequence = [
      { stepId: "scan-start", delay: 0, logIndex: 0 },
      { stepId: "bulk-detect", delay: 800, logIndex: 1 },
      { stepId: "confidence-split", delay: 1600, logIndex: null },
      { stepId: "known-sku", delay: 2400, logIndex: 2 },
      { stepId: "ambiguous-item", delay: 2400, logIndex: 3 },
      { stepId: "route-review", delay: 3200, logIndex: 4 },
      { stepId: "verify", delay: 4000, logIndex: 5 },
      { stepId: "inventory-log", delay: 4800, logIndex: 6 },
    ];

    setIsRunning(true);
    setLogMessages([]);
    stepIndexRef.current = 0;
    animationRefs.current = [];

    sequence.forEach(({ stepId, delay, logIndex }) => {
      const timeoutId = setTimeout(() => {
        setWorkflow(prev => prev.map(step => ({
          ...step,
          status: step.id === stepId ? "active" : step.status
        })));

        if (logIndex !== null) {
          addLogMessage(WORKFLOW_LOG_MESSAGES[logIndex]);
        }

        if (stepId === "known-sku") {
          setWorkflow(prev => prev.map(step => 
            step.id === "known-sku" ? { ...step, status: "completed" } : step
          ));
        }

        if (stepId === "verify") {
          setWorkflow(prev => prev.map(step => 
            step.id === "ambiguous-item" || step.id === "route-review" ? { ...step, status: "completed" } : step
          ));
        }

        if (stepId === "inventory-log") {
          setWorkflow(prev => prev.map(step => ({
            ...step,
            status: "completed"
          })));
          
          setTimeout(() => {
            setIsRunning(false);
            onComplete?.();
          }, 1000);
        }
      }, delay);
      animationRefs.current.push(timeoutId);
    });
  };

  const handleStart = () => {
    if (isRunning) return;
    
    setWorkflow(INITIAL_WORKFLOW);
    setLogMessages([]);
    runAnimation();
  };

  useEffect(() => {
    return () => {
      if (animationRefs.current) {
        animationRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📦 Inventory Workflow Demo</h3>
        <button
          onClick={handleStart}
          disabled={isRunning}
          style={{
            ...styles.button,
            opacity: isRunning ? 0.5 : 1,
            cursor: isRunning ? "not-allowed" : "pointer"
          }}
        >
          {isRunning ? "⏳ Running..." : "▶ Test Inventory Workflow"}
        </button>
      </div>

      <div style={styles.workflow}>
        {workflow.map((step, index) => (
          <div key={step.id} style={styles.stepContainer}>
            <div
              style={{
                ...styles.step,
                background: getStatusColor(step),
                border: step.type === "exception" && step.status === "active" ? "2px solid #ff6b6b" : "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <span style={styles.stepIcon}>{getStepIcon(step)}</span>
              <span style={styles.stepLabel}>{step.label}</span>
            </div>
            
            {index < workflow.length - 1 && (
              <div style={styles.connector}>
                {step.id === "confidence-split" ? (
                  <div style={styles.splitConnector}>
                    <div style={styles.splitLeft} />
                    <div style={styles.splitRight} />
                  </div>
                ) : (
                  <div style={styles.arrowDown}>▼</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.logPanel}>
        <div style={styles.logTitle}>📋 Activity Log</div>
        <div style={styles.logContent}>
          {logMessages.map((msg, i) => (
            <div key={i} style={styles.logEntry}>{msg}</div>
          ))}
          {logMessages.length === 0 && (
            <div style={styles.logEmpty}>Click the button to start the demo</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    border: "1px solid #4a4a6a",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },
  title: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#e8e8f0"
  },
  button: {
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "6px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    transition: "all 0.2s"
  },
  workflow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px"
  },
  stepContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "6px",
    minWidth: "180px",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
  },
  stepIcon: {
    fontSize: "16px"
  },
  stepLabel: {
    fontSize: "11px",
    fontWeight: 500,
    color: "white"
  },
  connector: {
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  arrowDown: {
    fontSize: "10px",
    color: "#6a6a8a"
  },
  splitConnector: {
    display: "flex",
    gap: "40px",
    position: "relative",
    width: "100px",
    justifyContent: "space-between"
  },
  splitLeft: {
    width: "2px",
    height: "20px",
    background: "linear-gradient(to bottom, #6a6a8a, #4a4a6a)",
    transform: "rotate(20deg)",
    transformOrigin: "top center"
  },
  splitRight: {
    width: "2px",
    height: "20px",
    background: "linear-gradient(to bottom, #6a6a8a, #4a4a6a)",
    transform: "rotate(-20deg)",
    transformOrigin: "top center"
  },
  logPanel: {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "12px",
    maxHeight: "180px",
    overflowY: "auto"
  },
  logTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#a0a0b0",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  logContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  logEntry: {
    fontSize: "10px",
    color: "#c8c8d8",
    padding: "4px 8px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "4px",
    borderLeft: "2px solid #4ecdc4"
  },
  logEmpty: {
    fontSize: "10px",
    color: "#606070",
    fontStyle: "italic",
    textAlign: "center",
    padding: "12px 8px"
  }
};

export default InventoryWorkflowDemo;
