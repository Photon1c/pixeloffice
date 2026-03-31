import { useEffect, useRef, useState, useCallback } from "react";
import { Agent, DashboardConfig, AgentStatus, AgentVisibility, Task, TaskStatus, TaskPriority, ZoneActivity } from "../types";
import GenealogyLab from "./GenealogyLab";
import AdminAssistant from "./AdminAssistant";
import StockForecasts from "./StockForecasts";
import TimeTasksPanel from "./TimeTasksPanel";
import ScrumPanel from "./ScrumPanel";
import {
  INITIAL_AGENTS,
  updateAgentPosition,
  updateAgentStatus,
  handleWanderLogic,
  updateAgentMood,
  generateThoughtBubble,
  clearExpiredThoughts,
  MOOD_OPTIONS,
  getMoodEmoji,
} from "../utils/agentLogic";
import { loadAgentCards, AgentCard, getAgentCardForRuntimeAgent } from "../utils/agentCards";
import {
  drawFloor,
  drawWalls,
  drawConferenceRoom,
  drawBossOffice,
  drawKitchen,
  drawCubicles,
  drawLounge,
  drawPlants,
  drawStatusBar,
  drawLobby,
  drawArchives,
  drawSpecialistSuite,
  drawZoneIndicators,
  drawMissionControl,
  drawDataNodes,
  drawSherlockOffice,
} from "../utils/drawOffice";
import { drawAgent, drawDeskItem } from "../utils/drawAgent";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  CHAIR_POSITIONS,
  getZoneAtPosition,
  ROOMS,
} from "../utils/layout";

function getKitchenPosition(agentIndex: number): { x: number; y: number } {
  const positions = [
    { x: 980, y: 80 },
    { x: 1040, y: 80 },
    { x: 1100, y: 80 },
    { x: 980, y: 140 },
    { x: 1040, y: 140 },
    { x: 1100, y: 140 },
  ];
  return positions[agentIndex % positions.length];
}

function getConferencePosition(agentIndex: number): { x: number; y: number } {
  const positions = [
    { x: 350, y: 95 },
    { x: 410, y: 95 },
    { x: 470, y: 95 },
    { x: 350, y: 145 },
    { x: 410, y: 145 },
    { x: 470, y: 145 },
    { x: 350, y: 195 },
    { x: 410, y: 195 },
  ];
  return positions[agentIndex % positions.length];
}

const DEFAULT_CONFIG: DashboardConfig = {
  pollingInterval: 5000,
  mockMode: true,
  mockToggleSpeed: 5000,
  showStatusBar: true,
  showNames: true,
  animationSpeed: 2,
  theme: "dark",
  canvasScale: 1,
  liveMode: false,
  viewMode: "public",
};

interface PixelOfficeProps {
  config?: Partial<DashboardConfig>;
}

export default function PixelOffice({ config = {} }: PixelOfficeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [agentCards, setAgentCards] = useState<AgentCard[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });
  const [showParams, setShowParams] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showTaskManager, setShowTaskManager] = useState<boolean>(false);
  const [showGenealogyLab, setShowGenealogyLab] = useState<boolean>(false);
  const [showAdminAssistant, setShowAdminAssistant] = useState<boolean>(false);
  const [showStockForecasts, setShowStockForecasts] = useState<boolean>(false);
  const [showTimeTasks, setShowTimeTasks] = useState<boolean>(false);
  const [showScrum, setShowScrum] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [zoneActivity, setZoneActivity] = useState<Map<string, ZoneActivity>>(new Map());
  const [activeConversationZone, setActiveConversationZone] = useState<string | null>(null);
  const [stigmergyTraces, setStigmergyTraces] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Review pull requests", description: "Check pending PRs from team", status: "in_progress", priority: "high", assigneeId: "ironclaw", createdAt: Date.now() - 86400000 },
    { id: "2", title: "Update documentation", description: "Add new API endpoints to docs", status: "todo", priority: "medium", createdAt: Date.now() - 172800000 },
    { id: "3", title: "Fix login bug", description: "Users reporting intermittent login failures", status: "done", priority: "high", assigneeId: "zeroclaw", createdAt: Date.now() - 259200000 },
    { id: "4", title: "Deploy to staging", description: "Push latest changes to staging environment", status: "todo", priority: "low", createdAt: Date.now() - 345600000 },
  ]);
  
  // Workflow animation state
  const workflowStateRef = useRef<{
    taskId: string;
    currentStep: number;
    totalSteps: number;
    currentAgent: string;
    status: "running" | "completed" | "failed";
    message: string;
    result?: any;
  } | null>(null);
  const [, forceUpdate] = useState(0);
  
  const setWorkflowState = (state: typeof workflowStateRef.current) => {
    workflowStateRef.current = state;
    forceUpdate(n => n + 1);
  };
  const workflowState = workflowStateRef.current;

  const lastFrameTime = useRef<number>(0);
  const walkCycleTimer = useRef<number>(0);
  const coolerTalkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coolerTalkEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isScrumRunning, setIsScrumRunning] = useState<boolean>(false);
  const [isCoolerTalkRunning, setIsCoolerTalkRunning] = useState<boolean>(false);

  // Load agent cards on mount
  useEffect(() => {
    loadAgentCards().then(setAgentCards);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!dashboardConfig.liveMode) return;

    try {
      const response = await fetch("/api/employee-status");
      const data = await response.json();
      setAgents((prevAgents) =>
        prevAgents.map((agent) => {
          const statusUpdate = data.employees.find(
            (e: { id: string; status: AgentStatus; visibility?: AgentVisibility }) => e.id === agent.id
          );
          if (statusUpdate) {
            const updatedAgent = updateAgentStatus(agent, statusUpdate.status);
            return {
              ...updatedAgent,
              visibility: statusUpdate.visibility || "public",
            };
          }
          return agent;
        })
      );
    } catch (error) {
      console.error("Failed to fetch employee status:", error);
    }
  }, [dashboardConfig.liveMode]);

  useEffect(() => {
    const fetchTraces = async () => {
      try {
        const resp = await fetch("/api/stigmergy/traces");
        const data = await resp.json();
        if (data.traces) setStigmergyTraces(data.traces);
      } catch (err) {
        console.warn("Failed to fetch stigmergy traces", err);
      }
    };

    const fetchTopic = async () => {
      try {
        const resp = await fetch("/api/cooler/topics/current");
        const data = await resp.json();
        if (data.topic) setCurrentTopic(data.topic);
      } catch {}
    };
    
    fetchTraces();
    fetchTopic();
    const interval = setInterval(fetchTraces, 5000);
    return () => clearInterval(interval);
  }, []);

  // STIGMERGY: Detect Task Shadows (abandoned work)
  useEffect(() => {
    agents.forEach(agent => {
      const hasTask = tasks.some(t => t.assigneeId === agent.id && t.status !== "done");
      if (agent.status === "idle" && hasTask) {
        const recentShadow = stigmergyTraces.find(t => t.type === "task_shadow" && t.agentId === agent.id);
        if (!recentShadow) {
          fetch("/api/stigmergy/deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "task_shadow",
              agentId: agent.id,
              intensity: 0.6,
              roomId: getZoneAtPosition(agent.x, agent.y) || "openOffice"
            })
          }).catch(() => {});
        }
      }
    });
  }, [agents, tasks, stigmergyTraces]);

   useEffect(() => {
     if (dashboardConfig.liveMode) {
       const interval = setInterval(fetchStatus, dashboardConfig.pollingInterval);
       return () => clearInterval(interval);
     }
 
      if (dashboardConfig.mockMode) {
        const interval = setInterval(
          () => {
            if (activeConversationZone) return;

            setAgents((prevAgents) =>
              prevAgents.map((agent) => {
                const newStatus: AgentStatus =
                  Math.random() > 0.3 ? "working" : "idle";
                return updateAgentStatus(agent, newStatus);
              })
            );
          },
          dashboardConfig.mockToggleSpeed
        );
        return () => clearInterval(interval);
      }
 
     const handleKeyDown = (e: KeyboardEvent) => {
       const leslieClaw = agents.find(agent => agent.id === "leslieclaw");
       if (leslieClaw) {
         const moveAmount = 5;
         
         switch(e.key.toLowerCase()) {
           case 'w':
             e.preventDefault();
             setAgents(prevAgents =>
               prevAgents.map(agent =>
                 agent.id === "leslieclaw" ? { ...agent, y: agent.y - moveAmount } : agent
               )
             );
             break;
           case 's':
             e.preventDefault();
             setAgents(prevAgents =>
               prevAgents.map(agent =>
                 agent.id === "leslieclaw" ? { ...agent, y: agent.y + moveAmount } : agent
               )
             );
             break;
           case 'a':
             e.preventDefault();
             setAgents(prevAgents =>
               prevAgents.map(agent =>
                 agent.id === "leslieclaw" ? { ...agent, x: agent.x - moveAmount } : agent
               )
             );
             break;
           case 'd':
             e.preventDefault();
             setAgents(prevAgents =>
               prevAgents.map(agent =>
                 agent.id === "leslieclaw" ? { ...agent, x: agent.x + moveAmount } : agent
               )
             );
             break;
         }
       }
     };
 
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [agents, activeConversationZone, dashboardConfig, fetchStatus]);

  useEffect(() => {
    const moodInterval = setInterval(() => {
      setAgents((prevAgents) =>
        prevAgents.map((agent) => {
          const randomMood = MOOD_OPTIONS[Math.floor(Math.random() * MOOD_OPTIONS.length)];
          let updated = updateAgentMood(agent, randomMood);
          if (Math.random() > 0.5) updated = generateThoughtBubble(updated);
          return clearExpiredThoughts(updated);
        })
      );
    }, 4000);
    return () => clearInterval(moodInterval);
  }, []);

  useEffect(() => {
    const zoneInterval = setInterval(() => {
      setAgents(prevAgents => {
        const newActivity = new Map<string, ZoneActivity>();
        prevAgents.forEach(agent => {
          const zone = getZoneAtPosition(agent.x, agent.y);
          if (!zone) return;
          const existing = newActivity.get(zone) || {
            zoneId: zone, agentCount: 0, busyLevel: "quiet" as const, lastActivity: Date.now(), conversationActive: false,
          };
          existing.agentCount += 1;
          if (agent.status === "working") existing.busyLevel = existing.agentCount > 2 ? "busy" : "moderate";
          existing.lastActivity = Date.now();
          newActivity.set(zone, existing);
        });
        setZoneActivity(newActivity);
        return prevAgents;
      });
    }, 2000);
    return () => clearInterval(zoneInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime.current;
      lastFrameTime.current = timestamp;
      walkCycleTimer.current += deltaTime;

      setAgents((prevAgents) =>
        prevAgents.map((agent) => {
          let updatedAgent = updateAgentPosition(agent, dashboardConfig.animationSpeed, deltaTime);
          updatedAgent = handleWanderLogic(updatedAgent);
          if (walkCycleTimer.current > 150 && updatedAgent.mode === "walking") {
            updatedAgent = { ...updatedAgent, frame: updatedAgent.frame === 0 ? 1 : 0 };
            walkCycleTimer.current = 0;
          }
          return updatedAgent;
        })
      );

      ctx.save();
      const scaleX = canvas.width / CANVAS_WIDTH;
      const scaleY = canvas.height / CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      ctx.scale(scale, scale);

      drawFloor(ctx);
      drawWalls(ctx);
      drawLobby(ctx);
      drawArchives(ctx);
      drawSpecialistSuite(ctx);
      drawConferenceRoom(ctx);
      
      const leslieclaw = agents.find(a => a.id === "leslieclaw");
      drawBossOffice(ctx, leslieclaw?.visibility);
      drawSherlockOffice(ctx);
     
      drawKitchen(ctx);
      drawMissionControl(ctx);
      drawDataNodes(ctx);
      drawCubicles(ctx);
      drawLounge(ctx);
      drawPlants(ctx);

      agents.forEach((agent) => drawDeskItem(ctx, agent));

      const shouldRespectPrivacy = dashboardConfig.viewMode === "public";
      agents.forEach((agent) => {
        if (shouldRespectPrivacy && agent.visibility === "offline") return;
        drawAgent(ctx, agent, dashboardConfig.showNames);
      });

      drawZoneIndicators(ctx, zoneActivity, stigmergyTraces);

      if (dashboardConfig.showStatusBar) {
        drawStatusBar(ctx, agents, shouldRespectPrivacy);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [agents, dashboardConfig, zoneActivity, stigmergyTraces]);

  const updateConfig = (updates: Partial<DashboardConfig>) => {
    setDashboardConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const scale = Math.min(canvas.width / CANVAS_WIDTH, canvas.height / CANVAS_HEIGHT);
    const worldClickX = clickX / scale;
    const worldClickY = clickY / scale;

    const clickedAgent = agents.find(agent => {
      const dx = agent.x - worldClickX;
      const dy = agent.y - worldClickY;
      return Math.sqrt(dx * dx + dy * dy) < 40;
    });

    setSelectedAgent(clickedAgent || null);
  }, [agents]);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  if (showGenealogyLab) return <GenealogyLab onNavigate={() => setShowGenealogyLab(false)} />;
  if (showAdminAssistant) return <AdminAssistant onNavigate={() => setShowAdminAssistant(false)} />;
  if (showStockForecasts) return <StockForecasts />;

  return (
    <div style={styles.container}>
      <div style={{...styles.sidebar, width: sidebarWidth}}>
        <div style={styles.resizeHandle} onMouseDown={() => setIsResizing(true)} />
        
        <div style={{ marginBottom: '16px' }}>
          <button style={styles.paramsToggle} onClick={() => setShowParams(!showParams)}>
            {showParams ? "▼ Hide Parameters" : "▶ Show Parameters"}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button style={{...styles.paramsToggle, background: showTimeTasks ? '#1a2a2a' : '#0a0a12', borderColor: '#4ecdc4'}} onClick={() => setShowTimeTasks(!showTimeTasks)}>
            {showTimeTasks ? "▼ Tasks" : "▶ Tasks"}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button style={{...styles.paramsToggle, background: showScrum ? '#1a2a2a' : '#0a0a12'}} onClick={() => setShowScrum(!showScrum)}>
            {showScrum ? "▼ SCRUM" : "▶ SCRUM"}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button style={{...styles.paramsToggle, background: showChat ? '#1a2a2a' : '#0a0a12'}} onClick={() => setShowChat(!showChat)}>
            {showChat ? "▼ Chat" : "▶ Chat"}
          </button>
        </div>
        
        {/* STIGMERGY PANEL */}
        <div style={{ background: "rgba(255, 100, 50, 0.1)", border: "1px solid #ff6432", borderRadius: "4px", padding: "10px", marginBottom: "16px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ color: "#ff6432", margin: 0, fontSize: "12px" }}>🔥 Review Heat</h4>
            <button onClick={async () => {
              const resp = await fetch("/api/cooler/topics/refresh", { method: 'POST' });
              const data = await resp.json();
              if (data.topic) setCurrentTopic(data.topic);
            }} style={styles.iconBtn} title="Refresh news topic">↻</button>
          </div>
          <div style={{ fontSize: '10px', color: '#feca57', marginBottom: '8px', fontStyle: 'italic' }}>Topic: {currentTopic || "Loading..."}</div>
          {stigmergyTraces.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255, 100, 50, 0.2)", paddingTop: "8px" }}>
              {stigmergyTraces.slice(0, 5).map((t, i) => (
                <div key={i} style={{ fontSize: "10px", color: "#e8e8f0", marginBottom: "4px" }}>
                  <strong>{t.intensity.toFixed(2)}</strong> - {t.type.replace('_', ' ')}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button id="editor-btn" style={{...styles.paramsToggle, background: showEditor ? '#1a2a2a' : '#0a0a12', borderColor: '#9b59b6'}} onClick={() => setShowEditor(!showEditor)}>
            {showEditor ? "▼ Editor" : "▶ Editor"}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button id="coolertalk-btn" style={{...styles.paramsToggle, background: '#7c5cbf', opacity: (isScrumRunning || isCoolerTalkRunning) ? 0.5 : 1}} disabled={isScrumRunning || isCoolerTalkRunning} onClick={() => {
            setIsCoolerTalkRunning(true);
            setActiveConversationZone("kitchen");
            // Move agents to kitchen positions
            const kitchenAgents = agents.slice(0, 6);
            setAgents(prev => prev.map((agent, idx) => {
              if (kitchenAgents.find(a => a.id === agent.id)) {
                const pos = getKitchenPosition(idx);
                return { ...agent, targetX: pos.x, targetY: pos.y, mode: "standing" };
              }
              return agent;
            }));
            fetch('/api/rooms/kitchen/cooler/run-turn', {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic: currentTopic, participants: agents.map(a => a.name).slice(0, 6) })
            }).then(r => r.json()).then(data => {
              console.log("[CoolerTalk] Response:", data);
            }).catch(err => {
              console.error("[CoolerTalk] Error:", err);
            }).finally(() => {
              setTimeout(() => {
                setIsCoolerTalkRunning(false);
                setActiveConversationZone(null);
                // Return agents to their desks
                setAgents(prev => prev.map(agent => ({
                  ...agent,
                  targetX: CHAIR_POSITIONS[agent.deskIndex]?.x || agent.x,
                  targetY: CHAIR_POSITIONS[agent.deskIndex]?.y || agent.y,
                  mode: "sitting"
                })));
              }, 8000);
            });
          }}>Cooler Talk</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button id="scrum-btn" style={{...styles.paramsToggle, background: '#2ecc71', opacity: (isScrumRunning || isCoolerTalkRunning) ? 0.5 : 1}} disabled={isScrumRunning || isCoolerTalkRunning} onClick={() => {
            setIsScrumRunning(true);
            setActiveConversationZone("conference");
            // Move agents to conference positions
            const confAgents = agents.slice(0, 8);
            setAgents(prev => prev.map((agent, idx) => {
              if (confAgents.find(a => a.id === agent.id)) {
                const pos = getConferencePosition(idx);
                return { ...agent, targetX: pos.x, targetY: pos.y, mode: "standing" };
              }
              return agent;
            }));
            setTimeout(() => {
              setIsScrumRunning(false);
              setActiveConversationZone(null);
              // Return agents to their desks
              setAgents(prev => prev.map(agent => ({
                ...agent,
                targetX: CHAIR_POSITIONS[agent.deskIndex]?.x || agent.x,
                targetY: CHAIR_POSITIONS[agent.deskIndex]?.y || agent.y,
                mode: "sitting"
              })));
            }, 8000);
          }}>Test SCRUM</button>
        </div>

        {showParams && <Dashboard config={dashboardConfig} onUpdate={updateConfig} onOpenGenealogyLab={() => setShowGenealogyLab(true)} onOpenAdminAssistant={() => setShowAdminAssistant(true)} onOpenStockForecasts={() => setShowStockForecasts(true)} />}
        {showTimeTasks && <TimeTasksPanel onClose={() => setShowTimeTasks(false)} />}
        {showScrum && <ScrumPanel />}
        {showChat && <ChatOverlay onClose={() => setShowChat(false)} />}
      </div>

      <div style={styles.mainContent}>
        <div style={styles.canvasWrapper} ref={containerRef}>
          <canvas ref={canvasRef} style={styles.canvas} onClick={handleCanvasClick} />
          {selectedAgent && (
            <AgentActionCard
              agent={selectedAgent}
              card={getAgentCardForRuntimeAgent(selectedAgent, agentCards)}
              workflowState={workflowState}
              setWorkflowState={setWorkflowState}
              onClose={() => setSelectedAgent(null)}
              tasks={tasks.filter(t => t.assigneeId === selectedAgent.id)}
              onMoodChange={(mood: any) => {
                setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updateAgentMood(a, mood) : a));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Dashboard({ config, onUpdate, onOpenGenealogyLab, onOpenAdminAssistant, onOpenStockForecasts }: any) {
  return (
    <div style={styles.subPanel}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <a href="http://localhost:4173/command" target="_blank" style={styles.commandLink}>Terminal ↗</a>
        <a href="http://127.0.0.1:5190" target="_blank" rel="noreferrer" style={styles.commandLink}>Sherlock CS ↗</a>
        <a href="http://185.211.4.97" target="_blank" rel="noreferrer" style={styles.commandLink}>NightWatchauton ↗</a>
        <a href="http://localhost:3847" target="_blank" rel="noreferrer" style={styles.commandLink}>ClawGuard ↗</a>
      </div>
      <h3 style={{ marginTop: 0 }}>Office Settings</h3>
      <div style={styles.formGroup}>
        <label><input type="checkbox" checked={config.liveMode} onChange={e => onUpdate({ liveMode: e.target.checked, mockMode: !e.target.checked })} /> Live Mode</label>
      </div>
      <div style={styles.formGroup}>
        <label><input type="checkbox" checked={config.showNames} onChange={e => onUpdate({ showNames: e.target.checked })} /> Show Names</label>
      </div>
      <button style={styles.secondaryBtn} onClick={onOpenGenealogyLab}>Genealogy Lab</button>
      <button style={styles.secondaryBtn} onClick={onOpenAdminAssistant}>Admin Assistant</button>
      <button style={styles.secondaryBtn} onClick={onOpenStockForecasts}>Stock Forecasts</button>
    </div>
  );
}

function AgentActionCard({ agent, card, workflowState, setWorkflowState, onClose, onMoodChange }: any) {
  const [chatMsg, setChatMsg] = useState("");
  const [replies, setReplies] = useState<string[]>([]);

  const handleChat = async () => {
    if (!chatMsg) return;
    const msg = chatMsg;
    setChatMsg("");
    setReplies(prev => [...prev, `You: ${msg}`]);
    
    try {
      const resp = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, agentName: agent.name, agentRole: agent.role })
      });
      const data = await resp.json();
      if (data.error) {
        setReplies(prev => [...prev, `System: ${data.error}`]);
      } else {
        setReplies(prev => [...prev, `${agent.name}: ${data.reply}`]);
      }
    } catch {
      setReplies(prev => [...prev, "System: Error connecting to agent."]);
    }
  };

  return (
    <div style={styles.agentCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{agent.name}</h2>
        <button onClick={onClose} style={styles.closeBtn}>×</button>
      </div>
      <p style={{ fontSize: '12px', color: '#a0a0b0' }}>{card?.description || agent.role}</p>
      
      {/* MODEL STATUS */}
      {card && (
        <div style={styles.modelStatus}>
          <span style={{...styles.badge, background: card.models.primary.status === 'local-ready' ? '#2ecc71' : '#f1c40f'}}>
            {card.models.primary.status === 'local-ready' ? 'Local' : 'Remote'}
          </span>
          <span style={{ fontSize: '10px', marginLeft: '8px' }}>{card.models.primary.name}</span>
        </div>
      )}

      {/* CHAT */}
      <div style={styles.chatBox}>
        {replies.map((r, i) => <div key={i} style={{ marginBottom: '4px' }}>{r}</div>)}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <input style={styles.input} value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Chat..." />
        <button style={styles.sendBtn} onClick={handleChat}>Send</button>
      </div>

      {/* MOODS */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
        {MOOD_OPTIONS.map(m => (
          <button key={m} onClick={() => onMoodChange(m)} style={styles.moodBtn}>{getMoodEmoji(m)}</button>
        ))}
      </div>

      {/* SPECIAL ACTIONS */}
      {agent.id === "frontdesk" && (
        <button style={{...styles.secondaryBtn, marginTop: '12px', background: '#e67e22'}} onClick={() => {
          // GitHub workflow trigger
        }}>GitHub README Workflow</button>
      )}
    </div>
  );
}

function ChatOverlay({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages.slice(-10) }),
      });
      const data = await response.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Failed to send message: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={chatStyles.overlay}>
      <div style={chatStyles.container}>
        <div style={chatStyles.header}>
          <h3 style={chatStyles.title}>Chat with Agents</h3>
          <button style={chatStyles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={chatStyles.messages}>
          {messages.length === 0 && (
            <div style={chatStyles.welcome}>
              <p>👋 Hi! I can help you explore your database.</p>
              <p>Try asking:</p>
              <ul>
                <li>"Show me what's in the database"</li>
                <li>"What tables exist?"</li>
                <li>"Show me the entities table"</li>
              </ul>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{...chatStyles.message, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "#1a3a3a" : "#0a0a12"}}>
              <div style={chatStyles.messageContent}>{msg.content}</div>
            </div>
          ))}
          {isLoading && <div style={{...chatStyles.message, alignSelf: "flex-start"}}><div style={chatStyles.messageContent}>Thinking...</div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div style={chatStyles.inputArea}>
          <input style={chatStyles.input} placeholder="Ask about the database..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} disabled={isLoading} />
          <button style={{...chatStyles.sendBtn, opacity: isLoading ? 0.5 : 1}} onClick={sendMessage} disabled={isLoading}>Send</button>
        </div>
      </div>
    </div>
  );
}
function TaskManager({ tasks, agents, onUpdateTask, onAddTask, onDeleteTask, onClose }: any) { return null; }

const chatStyles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  container: { width: "600px", maxWidth: "90vw", maxHeight: "80vh", background: "#0a0a12", borderRadius: "12px", border: "1px solid #1b2333", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1b2333" },
  title: { margin: 0, color: "#e8e8f0", fontSize: "16px" },
  closeBtn: { background: "transparent", border: "none", color: "#707080", fontSize: "24px", cursor: "pointer" },
  messages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "300px" },
  welcome: { color: "#707080", fontSize: "13px", lineHeight: 1.6 },
  message: { maxWidth: "80%", padding: "12px 16px", borderRadius: "12px" },
  messageContent: { color: "#e8e8f0", fontSize: "13px", whiteSpace: "pre-wrap", lineHeight: 1.5 },
  inputArea: { display: "flex", gap: "8px", padding: "16px", borderTop: "1px solid #1b2333" },
  input: { flex: 1, padding: "12px 16px", background: "#1a1a2a", border: "1px solid #2a3548", color: "#e8e8f0", borderRadius: "8px", fontSize: "14px" },
  sendBtn: { padding: "12px 24px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", width: "100vw", height: "100vh", background: "#050509", overflow: "hidden", color: "#e8e8f0", fontFamily: "'JetBrains Mono', monospace" },
  sidebar: { height: "100%", background: "#0a0a12", borderRight: "1px solid #1b2333", padding: "20px", display: "flex", flexDirection: "column", overflowY: "auto", position: "relative", flexShrink: 0 },
  mainContent: { flex: 1, height: "100%", position: "relative", overflow: "hidden" },
  canvasWrapper: { width: "100%", height: "100%", position: "relative" },
  canvas: { width: "100%", height: "100%", display: "block" },
  paramsToggle: { width: "100%", padding: "10px", background: "#1a2a2a", border: "1px solid #2a3548", color: "#4ecdc4", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: 600, textAlign: "left" },
  resizeHandle: { position: "absolute", right: 0, top: 0, bottom: 0, width: "4px", cursor: "col-resize", background: "transparent", zIndex: 10 },
  subPanel: { background: "#161625", padding: "15px", borderRadius: "8px", border: "1px solid #2a3548", marginTop: "10px" },
  commandLink: { color: "#4ecdc4", textDecoration: "none", fontSize: "12px", padding: "4px 8px", border: "1px solid #2a3548", borderRadius: "4px", background: "#0a0a12" },
  secondaryBtn: { width: "100%", padding: "8px", background: "#2a3548", color: "#fff", border: "none", borderRadius: "4px", marginTop: "8px", cursor: "pointer", fontSize: "12px" },
  agentCard: { position: "absolute", bottom: "100px", right: "20px", width: "300px", background: "rgba(15, 15, 25, 0.95)", border: "1px solid #3a3a5a", borderRadius: "12px", padding: "20px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" },
  chatBox: { height: "120px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "4px", padding: "8px", fontSize: "11px", margin: "12px 0", border: "1px solid #2a2a3a" },
  input: { flex: 1, background: "#0a0a15", border: "1px solid #2a2a3a", color: "#fff", padding: "6px", borderRadius: "4px", fontSize: "12px" },
  sendBtn: { background: "#4a90d9", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  moodBtn: { background: "#2a2a3a", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" },
  iconBtn: { background: "none", border: "none", color: "#ff6432", cursor: "pointer", fontSize: "14px" },
  badge: { padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", color: "#000" },
  modelStatus: { display: 'flex', alignItems: 'center', margin: '8px 0' },
  formGroup: { marginBottom: '8px' }
};
