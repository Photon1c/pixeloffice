import { useEffect, useRef, useState, useCallback } from "react";
import { Agent, DashboardConfig, AgentStatus, AgentVisibility, Task, ZoneActivity } from "../types";
import { LAB_MODE } from "../config/env";
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
  CHAIR_POSITIONS,
  getZoneAtPosition,
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
  const [socialPotential, setSocialPotential] = useState<{sessionCount: number; participantCount: number; intensity: number} | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [tasks] = useState<Task[]>([
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
  void setWorkflowState; // reserved for future use
  const workflowState = workflowStateRef.current;

  const lastFrameTime = useRef<number>(0);
  const walkCycleTimer = useRef<number>(0);
  
  const [isScrumRunning, setIsScrumRunning] = useState<boolean>(false);
  const [isCoolerTalkRunning, setIsCoolerTalkRunning] = useState<boolean>(false);
  const [sleepMode, setSleepMode] = useState<boolean>(false);

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

    const fetchSocialPotential = async () => {
      try {
        const resp = await fetch("/api/stigmergy/social-potential");
        const data = await resp.json();
        setSocialPotential(data);
      } catch (err) {
        console.warn("Failed to fetch social potential", err);
      }
    };

    const fetchTopic = async () => {
      try {
        const resp = await fetch("/api/cooler/topics/current");
        const data = await resp.json();
        // Handle both string topic and object topic
        if (data.topic) {
          const topicValue = typeof data.topic === 'object' ? data.topic.title : data.topic;
          setCurrentTopic(topicValue);
        }
      } catch {}
    };
    
    fetchTraces();
    fetchSocialPotential();
    fetchTopic();
    const interval = setInterval(() => {
      fetchTraces();
      fetchSocialPotential();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // STIGMERGY: Detect Task Shadows (abandoned work)
  useEffect(() => {
    const now = Date.now();
    agents.forEach(agent => {
      const hasTask = tasks.some(t => t.assigneeId === agent.id && t.status !== "done");
      if (agent.status === "idle" && hasTask) {
        // Only deposit one shadow per agent per 5 minutes to avoid duplicates
        const recentShadow = stigmergyTraces.find(t => 
          t.type === "task_shadow" && 
          t.agentId === agent.id &&
          (now - new Date(t.created_at).getTime()) < 5 * 60 * 1000
        );
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
             if (sleepMode) return; // Skip status toggles in sleep mode

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
      if (sleepMode && Math.random() > 0.3) return;
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
          const effectiveSpeed = sleepMode ? dashboardConfig.animationSpeed * 0.3 : dashboardConfig.animationSpeed;
          let updatedAgent = updateAgentPosition(agent, effectiveSpeed, deltaTime);
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
              {stigmergyTraces.slice(0, 10).map((t, i) => (
                <div key={`${t.type}-${t.roomId}-${t.agentId || i}`} style={{ fontSize: "10px", color: "#e8e8f0", marginBottom: "4px" }}>
                  <span style={{color: '#ff6432'}}>{t.intensity.toFixed(2)}</span> {t.type.replace(/_/g, ' ')} {t.roomId && `(${t.roomId})`} {t.agentId && `>@${t.agentId}`}
                </div>
              ))}
            </div>
          )}
          {stigmergyTraces.length === 0 && (
            <div style={{ fontSize: '9px', color: '#505060', borderTop: "1px solid rgba(255, 100, 50, 0.2)", paddingTop: "8px" }}>
              No stigmergy traces
            </div>
          )}
          
          {/* Social Activity Meter - Lab Mode Only */}
          {LAB_MODE && socialPotential && (
            <div style={{ borderTop: "1px solid rgba(100, 200, 150, 0.2)", paddingTop: "8px", marginTop: "8px" }}>
              <div style={{ fontSize: '10px', color: '#4ecdc4', marginBottom: '6px', fontWeight: 600 }}>💬 Social Activity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: '#1a2a3a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${socialPotential.intensity * 100}%`, background: socialPotential.intensity > 0.6 ? '#26de81' : socialPotential.intensity > 0.3 ? '#feca57' : '#4a5a6a', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '9px', color: '#a0a0b0' }}>{socialPotential.intensity.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '8px', color: '#606070', marginTop: '4px' }}>
                {socialPotential.sessionCount} sessions, {socialPotential.participantCount} participants (60min)
              </div>
            </div>
          )}
          
          {/* Task Shadow Hotspots - Lab Mode Only */}
          {LAB_MODE && (
            <div style={{ borderTop: "1px solid rgba(100, 150, 255, 0.2)", paddingTop: "8px", marginTop: "8px" }}>
              <div style={{ fontSize: '10px', color: '#6495ed', marginBottom: '6px', fontWeight: 600 }}>🔴 Unfinished Work Hotspots</div>
              {(() => {
                const shadowTraces = stigmergyTraces.filter(t => t.type === 'task_shadow');
                if (shadowTraces.length === 0) {
                  return <div style={{ fontSize: '9px', color: '#505060' }}>All clear</div>;
                }
                // Group by agent and calculate average intensity
                const byAgent: Record<string, { count: number; totalIntensity: number; roomId: string }> = {};
                shadowTraces.forEach(t => {
                  const aid = t.agentId || 'unknown';
                  if (!byAgent[aid]) byAgent[aid] = { count: 0, totalIntensity: 0, roomId: t.roomId || '' };
                  byAgent[aid].count++;
                  byAgent[aid].totalIntensity += t.intensity;
                });
                
                return Object.keys(byAgent).map(agentId => {
                  const data = byAgent[agentId];
                  const avgIntensity = data.totalIntensity / data.count;
                  const bars = Math.ceil(avgIntensity * 3);
                  return (
                    <div key={agentId} style={{ fontSize: '9px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#a0a0b0', minWidth: '50px' }}>{agentId}</span>
                      <span style={{ display: 'flex', gap: '2px' }}>
                        {[0,1,2].map(b => (
                          <span key={b} style={{ width: '6px', height: '8px', borderRadius: '2px', background: b < bars ? '#ff6b6b' : '#2a2a3a' }} />
                        ))}
                      </span>
                      <span style={{ color: '#ff6b6b', fontSize: '8px' }}>{avgIntensity.toFixed(2)}</span>
                    </div>
                  );
                });
              })()}
            </div>
          )}
          
          {/* Office Status Panel (per grok_suggestions.md) */}
          {LAB_MODE && (
            <div style={{ borderTop: "1px solid rgba(150, 100, 50, 0.2)", paddingTop: "8px", marginTop: "8px" }}>
              <div style={{ fontSize: '10px', color: '#f39c12', marginBottom: '6px', fontWeight: 600 }}>🏢 Office Status</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '9px', color: '#a0a0b0' }}>Sleep Mode</span>
                <button 
                  onClick={() => setSleepMode(prev => !prev)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: sleepMode ? '#27ae60' : '#2a2a3a',
                    color: sleepMode ? '#fff' : '#666'
                  }}
                >
                  {sleepMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <div style={{ fontSize: '8px', color: '#505060' }}>
                {sleepMode ? '🐌 Slowed agents, less chat' : '⚡ Normal activity'}
              </div>
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
          <button id="scrum-btn" style={{...styles.paramsToggle, background: '#2ecc71', opacity: (isScrumRunning || isCoolerTalkRunning) ? 0.5 : 1}} disabled={isScrumRunning || isCoolerTalkRunning} onClick={async () => {
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
            
            try {
              // Fetch available cooler sessions
              const sessionsRes = await fetch('/api/cooler/sessions/list');
              const sessionsData = await sessionsRes.json();
              const sessions = sessionsData.sessions || [];
              
              // Pick random session or use most recent
              let sessionId: string | undefined;
              let topicDisplay = "Daily standup";
              
              if (sessions.length > 0) {
                const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
                sessionId = randomSession.id;
                topicDisplay = randomSession.topic;
                console.log(`[Test SCRUM] Using session: ${sessionId} (${topicDisplay})`);
              }
              
              // Call test scrum endpoint
              const scrumRes = await fetch('/api/scrum/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coolerSessionId: sessionId })
              });
              const scrumData = await scrumRes.json();
              
              console.log('[Test SCRUM] Response:', scrumData);
              
              // Show test output in an alert or console
              if (scrumData.testOutput) {
                alert(`Test SCRUM created!\n\nSource: ${scrumData.testOutput.sourceTopic}\nParticipants: ${scrumData.testOutput.stigmergyWeighted?.join(", ") || "default"}\n\n${scrumData.testOutput.message}`);
              }
            } catch (err) {
              console.error('[Test SCRUM] Error:', err);
            }
            
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
      {LAB_MODE && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#4ecdc4', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔬 Lab Tools</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <a href="http://localhost:4173/command" target="_blank" style={styles.commandLink}>Terminal ↗</a>
            <a href="http://127.0.0.1:5190" target="_blank" rel="noreferrer" style={styles.commandLink}>Sherlock CS ↗</a>
            <a href="http://185.211.4.97" target="_blank" rel="noreferrer" style={styles.commandLink}>NightWatchauton ↗</a>
            <a href="http://localhost:3847" target="_blank" rel="noreferrer" style={styles.commandLink}>ClawGuard ↗</a>
          </div>
        </div>
      )}
      <h3 style={{ marginTop: 0 }}>Office Settings</h3>
      <div style={styles.formGroup}>
        <label><input type="checkbox" checked={config.liveMode} onChange={e => onUpdate({ liveMode: e.target.checked, mockMode: !e.target.checked })} /> Live Mode</label>
      </div>
      <div style={styles.formGroup}>
        <label><input type="checkbox" checked={config.showNames} onChange={e => onUpdate({ showNames: e.target.checked })} /> Show Names</label>
      </div>
      {LAB_MODE && (
        <>
          <button style={styles.secondaryBtn} onClick={onOpenGenealogyLab}>Genealogy Lab</button>
          <button style={styles.secondaryBtn} onClick={onOpenAdminAssistant}>Admin Assistant</button>
          <button style={styles.secondaryBtn} onClick={onOpenStockForecasts}>Stock Forecasts</button>
        </>
      )}
    </div>
  );
}

function AgentActionCard({ agent, card, workflowState, onClose, onMoodChange, tasks }: any) {
  const unassignedTasks = tasks?.filter((t: any) => !t.assigneeId) || [];
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemma-3-1b-it");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [githubRepo, setGithubRepo] = useState("photon1c/pixeloffice");
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  
  const isReceptionist = agent.role === "receptionist";
  
  // Available local models (per ollama list) + NVIDIA cloud option
  const [nvidiaStatus, setNvidiaStatus] = useState<{available: boolean; modelId?: string} | null>(null);
  
  useEffect(() => {
    console.log('[AgentCard] Fetching NVIDIA status...');
    fetch('/api/test/nvidia')
      .then(res => res.json())
      .then(data => {
        console.log('[AgentCard] NVIDIA status received:', data);
        setNvidiaStatus(data);
      })
      .catch(err => console.log('[AgentCard] NVIDIA check failed:', err));
  }, []);
  
  console.log('[AgentCard] Current nvidiaStatus:', nvidiaStatus);
  
  // NVIDIA model options
  const nvidiaOptions = nvidiaStatus?.available ? [
    { id: "nvidia-deepseek", name: "NVIDIA DeepSeek v3.1" },
    { id: "nvidia-glm4.7", name: "NVIDIA GLM-4.7" },
  ] : [];
  console.log('[AgentCard] NVIDIA options:', nvidiaOptions);
  
  const availableModels = [
    { id: "gemma-3-1b-it", name: "Gemma 3 (1B)" },
    { id: "PhysicsObsession/blaze-3b:latest", name: "Blaze (3B)" },
    ...nvidiaOptions,
  ];

  // Visual pipeline steps for GitHub workflows
  const workflowSteps = [
    { agent: "frontdesk", message: "Receptionist processing request...", delay: 2000 },
    { agent: "openclaw", message: "Clerk routing to specialist...", delay: 2500 },
    { agent: "zeroclaw", message: "Specialist fetching from GitHub...", delay: 3000 },
    { agent: "hermitclaw", message: "Archivist archiving results...", delay: 2000 },
  ];

  const runVisualWorkflow = async () => {
    if (!githubRepo.includes('/')) {
      setGithubError("Invalid repo format. Use owner/repo");
      return;
    }
    
    const [owner, repo] = githubRepo.split('/');
    setGithubLoading(true);
    setGithubError(null);
    
    // Run visual animation
    for (let i = 0; i < workflowSteps.length; i++) {
      const step = workflowSteps[i];
      if (typeof window !== 'undefined' && (window as any).setWorkflowState) {
        (window as any).setWorkflowState({
          taskId: "github-readme",
          currentStep: i,
          totalSteps: workflowSteps.length,
          currentAgent: step.agent,
          status: "running",
          message: step.message
        });
      }
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
    
    // Now call actual API
    try {
      const response = await fetch('http://localhost:4173/api/workflow/github/readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo })
      });
      
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const data = await response.json();
      
      if (typeof window !== 'undefined' && (window as any).setWorkflowState) {
        (window as any).setWorkflowState({
          taskId: "github-readme",
          currentStep: workflowSteps.length,
          totalSteps: workflowSteps.length,
          currentAgent: "hermitclaw",
          status: "completed",
          message: "Workflow complete!"
        });
      }
      
      // Show result - could open a modal or display inline
      alert(`README fetched! Length: ${data.response?.length || 0} chars`);
      
    } catch (err: any) {
      console.error("GitHub workflow error:", err);
      setGithubError(err.message || "Failed to fetch README");
      if (typeof window !== 'undefined' && (window as any).setWorkflowState) {
        (window as any).setWorkflowState({
          taskId: "github-readme",
          currentStep: 0,
          totalSteps: workflowSteps.length,
          currentAgent: "zeroclaw",
          status: "failed",
          message: "Workflow failed"
        });
      }
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || isLoading) return;
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsLoading(true);
    fetch('/api/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, model: selectedModel, agentName: agent.name, agentRole: agent.role })
    })
    .then(response => response.json())
    .then(data => {
      setIsLoading(false);
      if (data.reply) setChatMessages(prev => [...prev, { role: "agent", content: data.reply }]);
      else if (data.error) setChatMessages(prev => [...prev, { role: "agent", content: `Error: ${data.error}` }]);
    })
    .catch(error => {
      setIsLoading(false);
      setChatMessages(prev => [...prev, { role: "agent", content: `Error: ${error.message}` }]);
    });
  };

  return (
    <div style={actionCardStyles.overlay} onClick={onClose}>
      <div style={actionCardStyles.card} onClick={e => e.stopPropagation()}>
        <div style={actionCardStyles.header}>
          <div style={{...actionCardStyles.avatar, backgroundColor: agent.color}}>{agent.name.charAt(0)}</div>
          <div>
            <h3 style={actionCardStyles.name}>{agent.name}</h3>
            <span style={actionCardStyles.role}>{agent.role}</span>
          </div>
          <button style={actionCardStyles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div style={actionCardStyles.statusRow}>
          <span style={{...actionCardStyles.statusDot, background: agent.status === 'working' ? '#26de81' : '#f1c40f'}} />
          <span style={actionCardStyles.statusText}>{agent.status === 'working' ? 'Working' : 'Idle'}</span>
          {card?.models?.primary?.status && (
            <span style={{...actionCardStyles.visibilityBadge, background: card.models.primary.status === 'local-ready' ? '#26de81' : '#4a90d9', color: '#050509', marginLeft: 'auto'}}>
              {card.models.primary.status === 'local-ready' ? 'Local' : 'Remote'}
            </span>
          )}
        </div>

        <div style={actionCardStyles.section}>
          <h4 style={actionCardStyles.sectionTitle}>Mood: {getMoodEmoji(agent.mood)}</h4>
          <div style={actionCardStyles.moodGrid}>
            {MOOD_OPTIONS.map(mood => (
              <button key={mood} style={{...actionCardStyles.moodBtn, borderColor: agent.mood === mood ? '#4ecdc4' : '#2a3548'}} onClick={() => onMoodChange?.(mood)}>
                {getMoodEmoji(mood)}
              </button>
            ))}
          </div>
        </div>

        <div style={actionCardStyles.section}>
          <h4 style={actionCardStyles.sectionTitle}>Quick Actions</h4>
          {isReceptionist && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: '#707080', display: 'block', marginBottom: '4px' }}>Target GitHub Repo</label>
                <input 
                  style={{ ...actionCardStyles.chatInput, width: '100%', boxSizing: 'border-box' }}
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="owner/repo"
                />
              </div>
              <select 
                style={{width: '100%', padding: '10px 12px', background: '#1a2538', border: '1px solid #3a4a5a', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer'}}
                value={selectedWorkflow}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedWorkflow(value);
                  if (value === 'readme') {
                    runVisualWorkflow();
                  } else if (value === 'write-readme') {
                    alert('Write README workflow - implement write-readme API');
                  } else if (value === 'sitrep') {
                    alert('SitRep workflow - configure endpoint');
                  } else if (value === 'nightly') {
                    alert('Nightly report workflow coming soon!');
                  }
                  setSelectedWorkflow("");
                }}
              >
                <option value="">Select Workflow...</option>
                <option value="readme">Fetch GitHub README</option>
                <option value="write-readme">Write README Section</option>
                <option value="sitrep">Generate Office SitRep</option>
                <option value="nightly">Generate Nightly Report</option>
              </select>
            </>
          )}
        </div>

        {workflowState && (
          <div style={actionCardStyles.section}>
            <div style={{background: '#0a1520', border: '1px solid #2a3a4a', borderRadius: '8px', padding: '16px', marginTop: '12px'}}>
              <div style={{color: '#4ecdc4', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                {workflowState.status === 'running' && (
                  <span style={{width: '10px', height: '10px', borderRadius: '50%', background: '#4ecdc4', animation: 'pulse 1s infinite'}} />
                )}
                {workflowState.status === 'completed' && '✓'}
                {workflowState.status === 'failed' && '✗'}
                {workflowState.message}
              </div>
              <div style={{height: '6px', background: '#1a2a3a', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px'}}>
                <div style={{height: '100%', width: `${((workflowState.currentStep + 1) / workflowState.totalSteps) * 100}%`, background: workflowState.status === 'completed' ? '#26de81' : workflowState.status === 'failed' ? '#fc5c65' : '#4ecdc4', transition: 'width 0.5s ease-out'}} />
              </div>
              <div style={{display: 'flex', gap: '8px', justifyContent: 'space-between'}}>
                {['Receptionist', 'Clerk', 'Specialist', 'Archivist'].map((step, idx) => {
                  const isActive = idx === workflowState.currentStep;
                  const isComplete = idx < workflowState.currentStep || workflowState.status === 'completed';
                  return (
                    <div key={step} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                      <div style={{width: '24px', height: '24px', borderRadius: '50%', background: isComplete ? '#26de81' : isActive ? '#4ecdc4' : '#2a3a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: isComplete || isActive ? '#050509' : '#606070', boxShadow: isActive ? '0 0 10px #4ecdc4' : 'none'}}>
                        {isComplete ? '✓' : idx + 1}
                      </div>
                      <span style={{fontSize: '9px', color: isActive ? '#4ecdc4' : isComplete ? '#26de81' : '#505060'}}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {unassignedTasks.length > 0 && (
          <div style={actionCardStyles.section}>
            <h4 style={actionCardStyles.sectionTitle}>Assign Task</h4>
            {unassignedTasks.slice(0, 3).map((task: any) => (
              <button key={task.id} style={actionCardStyles.taskItem}>
                <span style={{...actionCardStyles.priorityDot, background: task.priority === 'high' ? '#ff4b4b' : task.priority === 'medium' ? '#feca57' : '#4ecdc4'}} />
                {task.title}
              </button>
            ))}
          </div>
        )}

        <div style={actionCardStyles.chatContainer}>
          <h4 style={actionCardStyles.sectionTitle}>Chat with {agent.name}</h4>
          <div style={actionCardStyles.modelSelect}>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={actionCardStyles.modelDropdown}>
              {availableModels.map(model => (<option key={model.id} value={model.id}>{model.name}</option>))}
            </select>
          </div>
          <div style={actionCardStyles.chatMessages}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{...actionCardStyles.chatMessage, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "#1a3a3a" : "#0f1520", border: msg.role === "user" ? "1px solid #4ecdc4" : "1px solid #2a3a4a"}}>
                {msg.content}
              </div>
            ))}
            {isLoading && <div style={{color: '#4ecdc4', fontSize: '12px'}}>Thinking...</div>}
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <input style={actionCardStyles.chatInput} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder={`Ask ${agent.name}...`} />
            <button style={actionCardStyles.chatSendBtn} onClick={handleSendChat} disabled={isLoading}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatOverlay({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemma-3-1b-it");
  const [nvidiaStatus, setNvidiaStatus] = useState<{available: boolean; modelId?: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch('/api/test/nvidia')
      .then(res => res.json())
      .then(data => {
        console.log('[Chat] NVIDIA status:', data);
        setNvidiaStatus(data);
      })
      .catch(err => console.log('[Chat] NVIDIA check failed:', err));
  }, []);

  console.log('[Chat] nvidiaStatus:', nvidiaStatus);
  
  const nvidiaOptions = [
    { id: "nvidia-deepseek", name: "NVIDIA DeepSeek v3.1" },
    { id: "nvidia-glm4.7", name: "NVIDIA GLM-4.7" },
  ];
  const availableModels = [
    { id: "gemma-3-1b-it", name: "Gemma 3 (1B)" },
    { id: "PhysicsObsession/blaze-3b:latest", name: "Blaze (3B)" },
    ...(nvidiaStatus?.available ? nvidiaOptions : []),
  ];

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    // Check for delegation commands (per grok_suggestions.md)
    let delegationNotice = "";
    try {
      const delRes = await fetch("/api/detect-delegation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const delData = await delRes.json();
      if (delData.detected) {
        delegationNotice = `\n\n✨ ${delData.message}`;
        console.log("[Delegation] Detected and handled:", delData);
      }
    } catch (delErr) {
      console.log("[Delegation] Check failed:", delErr);
    }
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages.slice(-10), model: selectedModel }),
      });
      const data = await response.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      } else {
        const replyContent = data.reply + (delegationNotice || "");
        setMessages(prev => [...prev, { role: "assistant", content: replyContent }]);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ padding: '4px 8px', background: '#1a2a3a', border: '1px solid #3a4a5a', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer' }}
            >
              {availableModels.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
            <button style={chatStyles.closeBtn} onClick={onClose}>×</button>
          </div>
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

const actionCardStyles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  card: { width: "380px", maxHeight: "85vh", background: "rgba(15, 15, 25, 0.98)", borderRadius: "12px", border: "1px solid #2a3a4a", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" },
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid #2a3a4a" },
  avatar: { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold", color: "#050509" },
  name: { margin: 0, fontSize: "16px", color: "#e8e8f0" },
  role: { fontSize: "12px", color: "#707080", textTransform: "capitalize" },
  closeBtn: { background: "transparent", border: "none", color: "#707080", fontSize: "24px", cursor: "pointer", marginLeft: "auto" },
  statusRow: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderBottom: "1px solid #1a2a3a", fontSize: "12px" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%" },
  statusText: { color: "#a0a0b0" },
  visibilityBadge: { fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#2a3a4a", color: "#e0e8f0" },
  section: { padding: "12px 16px", borderBottom: "1px solid #1a2a3a" },
  sectionTitle: { margin: "0 0 8px 0", fontSize: "12px", color: "#4ecdc4", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  moodGrid: { display: "flex", gap: "6px", flexWrap: "wrap" },
  moodBtn: { background: "#1a2a3a", border: "1px solid #2a3548", borderRadius: "6px", padding: "6px 10px", fontSize: "16px", cursor: "pointer" },
  actions: { display: "flex", flexDirection: "column", gap: "8px" },
  actionBtn: { padding: "10px", background: "#1a2a3a", border: "1px solid #2a3548", borderRadius: "6px", color: "#e0e8f0", cursor: "pointer", fontSize: "13px" },
  taskList: { display: "flex", flexDirection: "column", gap: "6px" },
  taskItem: { display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "#1a2538", border: "1px solid #2a3548", borderRadius: "6px", color: "#e0e8f0", cursor: "pointer", fontSize: "12px", textAlign: "left" },
  priorityDot: { width: "6px", height: "6px", borderRadius: "50%" },
  chatContainer: { padding: "12px 16px" },
  modelSelect: { marginBottom: "8px" },
  modelDropdown: { width: "100%", padding: "6px 8px", background: "#1a2538", border: "1px solid #2a3548", borderRadius: "4px", color: "#e0e8f0", fontSize: "12px" },
  chatMessages: { height: "120px", overflowY: "auto", background: "#0a1520", borderRadius: "6px", padding: "8px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" },
  chatMessage: { padding: "8px 10px", borderRadius: "6px", fontSize: "12px", lineHeight: 1.4, maxWidth: "85%" },
  chatInput: { flex: 1, padding: "8px 10px", background: "#1a2538", border: "1px solid #2a3548", borderRadius: "4px", color: "#e0e8f0", fontSize: "12px" },
  chatSendBtn: { padding: "8px 16px", background: "#4a90d9", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }
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
