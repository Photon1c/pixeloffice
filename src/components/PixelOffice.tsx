import { useEffect, useRef, useState, useCallback } from "react";
import { Agent, DashboardConfig, AgentStatus, AgentVisibility, Task, ZoneActivity } from "../types";
import { LAB_MODE } from "../config/env";
import { setupConsoleMonitor } from "../utils/consoleMonitor";
import { StabilityMonitor, AgentIssueMonitor } from "./StabilityMonitor";
import { TSAHealthPanel } from "./TSAHealthPanel";
import GenealogyLab from "./GenealogyLab";
import AdminAssistant from "./AdminAssistant";
import StockForecasts from "./StockForecasts";
import TimeTasksPanel from "./TimeTasksPanel";
import ScrumPanel from "./ScrumPanel";
import OfficeClock from "./OfficeClock";
import YouTubePlayer from "./YouTubePlayer";
import CalendarPanel from "./CalendarPanel";
import InventoryWorkflowDemo from "./InventoryWorkflowDemo";
import { getPeriodForHour } from "../utils/schedule";
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
  initiateWalkUpChat,
  enhanceTextWithEmoji,
  WalkUpChatSession,
  applyScheduleToAgents,
} from "../utils/agentLogic";
import { loadAgentCards, fetchOllamaModels, AgentCard, getAgentCardForRuntimeAgent } from "../utils/agentCards";
import { createLogger } from "../utils/consoleMonitor";
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
  ENTRANCE_POSITION,
  getZoneAtPosition,
} from "../utils/layout";

// Loop detection available at: import { detectLoopOrStall } from "../utils/loopDetection";

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
    { x: 750, y: 85 },
    { x: 800, y: 85 },
    { x: 850, y: 85 },
    { x: 750, y: 205 },
    { x: 800, y: 205 },
    { x: 850, y: 205 },
    { x: 740, y: 145 },
    { x: 860, y: 145 },
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
  const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...");
  const log = createLogger("PixelOffice");
  const renderLog = createLogger("Render");
  
  useEffect(() => {
    setupConsoleMonitor();
    log.info("Initializing Pixel Office");
  }, []);
  
  useEffect(() => {
    (window as any).clearSpeechBubbles = () => {
      setSpeechBubbles([]);
    };
    
    return () => {
      delete (window as any).clearSpeechBubbles;
    };
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && window.innerWidth < 480) {
        setSidebarWidth(window.innerWidth - 20);
        setShowMobileSidebar(false); // Start collapsed on small screens
      } else if (mobile) {
        setSidebarWidth(Math.min(280, window.innerWidth - 40));
        setShowMobileSidebar(true);
      } else {
        setShowMobileSidebar(true);
      }
      // Hide right panel on mobile by default for more canvas space
      setShowRightPanel(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Test conversation: deploy random agent to another agent workspace
  // Multi-turn test conversation (5+ turns) with save functionality
  const testTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const isTestRunningRef = useRef(false);
  useEffect(() => { isTestRunningRef.current = isTestRunning; }, [isTestRunning]);
  const testAgentIdsRef = useRef<{visitor: string; host: string} | null>(null);
  
  const handleTestConversation = () => {
    if (isTestRunning) {
      console.log("[TestConversation] Already running, skipping");
      return;
    }
    
    console.log("[TestConversation] Starting multi-turn agent conversation");
    setIsTestRunning(true);
    
    // Clear any pending timeouts from previous test
    testTimeoutsRef.current.forEach(clearTimeout);
    testTimeoutsRef.current = [];
    
    // Pick two different random agents from current state
    const currentAgents = agentsRef.current;
    const availableAgents = currentAgents.filter(a => a.id !== "frontdesk");
    if (availableAgents.length < 2) {
      console.warn("[TestConversation] Not enough agents");
      setIsTestRunning(false);
      return;
    }
    
    const visitorIdx = Math.floor(Math.random() * availableAgents.length);
    let hostIdx = Math.floor(Math.random() * availableAgents.length);
    if (hostIdx === visitorIdx) {
      hostIdx = (hostIdx + 1) % availableAgents.length;
    }
    
    const visitor = availableAgents[visitorIdx];
    const host = availableAgents[hostIdx];
    const sessionId = `test-${Date.now()}`;
    
    // Track which agents are in the test (to suspend their wandering)
    testAgentIdsRef.current = { visitor: visitor.id, host: host.id };
    
    // Position agents: visitor walks to host's location
    // Host stays put (standing), visitor walks over
    const conversationSpacing = 60;
    const hostTargetX = host.x;
    const hostTargetY = host.y;
    const visitorTargetX = host.x + conversationSpacing;
    const visitorTargetY = host.y;
    
    console.log("[TestConversation]", visitor.name, "visiting", host.name);
    
    // 8-turn conversation script
    const conversationScript = [
      { speaker: visitor.name, text: "Hey, got a minute to chat about the project?", delay: 1500 },
      { speaker: host.name, text: "Sure! What's on your mind?", delay: 3000 },
      { speaker: visitor.name, text: "I've been thinking about our architecture. Are we happy with the current setup?", delay: 4500 },
      { speaker: host.name, text: "Good question. I think it's working well, but we could optimize the data flow.", delay: 6000 },
      { speaker: visitor.name, text: "Exactly! Maybe we should document some improvements?", delay: 7500 },
      { speaker: host.name, text: "Great idea. Let's bring it up in the next standup.", delay: 9000 },
      { speaker: visitor.name, text: "Perfect, thanks for the chat!", delay: 10500 },
      { speaker: host.name, text: "Anytime! That's what teammates are for.", delay: 12000 }
    ];
    
    // Set host to standing (waiting for visitor)
    // Set visitor to walking (moving to host)
    renderAgentsRef.current = renderAgentsRef.current.map(a => {
      if (a.id === host.id) {
        return { ...a, targetX: hostTargetX, targetY: hostTargetY, mode: "standing", dir: "right", status: "idle" as const };
      }
      if (a.id === visitor.id) {
        return { ...a, targetX: visitorTargetX, targetY: visitorTargetY, mode: "walking", dir: visitorTargetX > a.x ? "right" : "left", status: "idle" as const };
      }
      // Other agents stay at their desks (no wandering during test)
      const deskPos = CHAIR_POSITIONS[a.deskIndex];
      return { ...a, targetX: deskPos.x, targetY: deskPos.y, mode: "sitting", status: "idle" as const };
    });
    // DO NOT call setAgents() - triggers re-render that resets movement!
    
    // Clear any existing test bubbles first
    setSpeechBubbles([]);
    
    // Show conversation progressively with stacked bubbles
    // Bubbles stack vertically: -20, -70, -120, -170 (50px spacing each)
    conversationScript.forEach((turn, i) => {
      const timeoutId = setTimeout(() => {
        const speakerAgentId = turn.speaker === visitor.name ? visitor.id : host.id;
        const bubbleStackIndex = i % 4; // Max 4 visible bubbles
        const verticalSpacing = 50;
        const yOffset = -20 - (bubbleStackIndex * verticalSpacing);
        
        setSpeechBubbles(prev => {
          // Remove previous bubbles for these two agents only (prevent duplicates)
          const filtered = prev.filter(b => b.speakerId !== visitor.id && b.speakerId !== host.id);
          return [
            ...filtered,
            {
              speakerId: speakerAgentId,
              text: turn.text,
              offset: bubbleStackIndex * 55, // 55px horizontal offset per bubble
              yOffset: yOffset
            }
          ];
        });
        
        // Emit route to router visualizer for each conversation turn
        fetch('http://localhost:5007/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: visitor.id.toUpperCase().slice(0, 8),
            to: host.id.toUpperCase().slice(0, 8),
            confidence: 0.92,
            model: "local",
            task_id: `agent2agent-${Date.now()}-${i}`,
            route_type: "agent_conversation",
            turn: i + 1,
            speaker: turn.speaker
          })
        }).catch(err => console.log('[Router] Agent2Agent route emit failed:', err.message));
      }, turn.delay);
      testTimeoutsRef.current.push(timeoutId);
    });
    
    // Emit session completion to router visualizer
    const completionTimeout = setTimeout(() => {
      fetch('http://localhost:5007/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: "CONVERSATION",
          to: "ARCHIVE",
          confidence: 0.95,
          model: "local",
          task_id: `agent2agent-complete-${Date.now()}`,
          route_type: "conversation_complete",
          participants: [visitor.name, host.name],
          turns: conversationScript.length
        })
      }).catch(err => console.log('[Router] Agent2Agent complete emit failed:', err.message));
    }, 12500);
    testTimeoutsRef.current.push(completionTimeout);
    
    // Return visitor after conversation
    const returnTimeout = setTimeout(() => {
      // CRITICAL: Update renderAgentsRef.current directly for visual movement
      renderAgentsRef.current = renderAgentsRef.current.map(a => {
        if (a.id === visitor.id || a.id === host.id) {
          const deskPos = CHAIR_POSITIONS[a.deskIndex];
          return { ...a, targetX: deskPos.x, targetY: deskPos.y, mode: "walking", dir: deskPos.x > a.x ? "right" : "left" };
        }
        return a;
      });
      // DO NOT call setAgents() - triggers re-render that resets movement!
      
      // Clear test agent tracking
      testAgentIdsRef.current = null;
      // Clear bubbles when done
      const clearTimeoutId = setTimeout(() => {
        setSpeechBubbles([]);
        setIsTestRunning(false);
      }, 2000);
      testTimeoutsRef.current.push(clearTimeoutId);
    }, 12000);
    testTimeoutsRef.current.push(returnTimeout);
    
    // Enable save button for conversation panel
    const saveTimeout = setTimeout(() => {
      (window as any).enableSaveConversation?.({
        sessionId,
        participants: [visitor.name, host.name],
        conversation: conversationScript.map(t => ({ speaker: t.speaker, text: t.text })),
        timestamp: Date.now()
      });
    }, 12500);
    testTimeoutsRef.current.push(saveTimeout);
  };
  
  const [resetInterval, setResetInterval] = useState(() => {
    const saved = localStorage.getItem("pixel_office_reset_interval");
    return saved ? parseInt(saved, 10) : 10;
  });
  
  const frameCountRef = useRef(0);
  const [fps, setFps] = useState(60);
  const [cpu, setCpu] = useState(0);
  const [memory, setMemory] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      // Simulate CPU based on agent count and activity (more realistic values)
      const currentAgents = agentsRef.current;
      const activeAgents = currentAgents.filter(a => a.mode === 'walking' || a.speechBubble || a.thoughtBubble).length;
      setCpu(Math.min(95, 8 + (currentAgents.length * 1.5) + (activeAgents * 2) + Math.random() * 5));
      // Simulate memory based on agent state complexity
      setMemory(Math.min(95, 15 + (currentAgents.length * 2) + Math.random() * 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Auto-reset arena on mount so agents show up to work (skip if entrance animation will run)
  useEffect(() => {
    if (!entranceActive) {
      handleReset();
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem("pixel_office_reset_interval", String(resetInterval));
  }, [resetInterval]);

  const handleReset = useCallback(() => {
    localStorage.removeItem("pixel_office_agents");
    setAgents(INITIAL_AGENTS.map((agent, i) => ({
      ...agent,
      x: CHAIR_POSITIONS[agent.deskIndex].x,
      y: CHAIR_POSITIONS[agent.deskIndex].y,
      targetX: CHAIR_POSITIONS[agent.deskIndex].x,
      targetY: CHAIR_POSITIONS[agent.deskIndex].y,
      mode: "sitting",
      dir: "right"
    })));
    console.log('[PixelOffice] Arena reset - agents at desks');
  }, []);

  const entranceDone = localStorage.getItem("pixel_office_entrance_done");
  const [entranceActive, setEntranceActive] = useState(!entranceDone);

  const [agents, setAgents] = useState<Agent[]>(() => {
    if (!entranceDone) {
      return INITIAL_AGENTS.map((agent, i) => ({
        ...agent,
        x: ENTRANCE_POSITION.x,
        y: ENTRANCE_POSITION.y + i * 18,
        targetX: ENTRANCE_POSITION.x,
        targetY: ENTRANCE_POSITION.y + i * 18,
        dir: "right",
        mode: "sitting",
      }));
    }
    const saved = localStorage.getItem("pixel_office_agents");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = INITIAL_AGENTS.map(initial => {
            const savedAgent = parsed.find((a: Agent) => a.id === initial.id);
            return savedAgent ? { ...initial, ...savedAgent } : initial;
          });
          INITIAL_AGENTS.forEach(initial => {
            if (!merged.find(m => m.id === initial.id)) merged.push(initial);
          });
          return merged;
        }
      } catch (e) {
        console.warn("Failed to load agents from localStorage", e);
      }
    }
    return INITIAL_AGENTS;
  });

  useEffect(() => {
    if (entranceActive) return;
    localStorage.setItem("pixel_office_agents", JSON.stringify(agents));
  }, [agents, entranceActive]);
  const [agentCards, setAgentCards] = useState<AgentCard[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });
  const [showParams, setShowParams] = useState<boolean>(false);
  const [showTimeTasks, setShowTimeTasks] = useState<boolean>(false);
  const [showScrum, setShowScrum] = useState<boolean>(false);
  const [showScrumSettings, setShowScrumSettings] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showGenealogyLab, setShowGenealogyLab] = useState<boolean>(false);
  const [showAdminAssistant, setShowAdminAssistant] = useState<boolean>(false);
  const [showStockForecasts, setShowStockForecasts] = useState<boolean>(false);
  const [showConvoViewer, setShowConvoViewer] = useState<boolean>(false);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [scrumRepo, setScrumRepo] = useState<string>("");
  const [scrumTask, setScrumTask] = useState<string>("");
  const [convoViewerType, setConvoViewerType] = useState<"cooler" | "scrum">("cooler");
  const [convoSessions, setConvoSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [zoneActivity, setZoneActivity] = useState<Map<string, ZoneActivity>>(new Map());
  const debouncedDeskUpdates = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [activeConversationZone, setActiveConversationZone] = useState<string | null>(null);
  const [stigmergyTraces, setStigmergyTraces] = useState<any[]>([]);
  const [socialPotential, setSocialPotential] = useState<{sessionCount: number; participantCount: number; intensity: number} | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [newsApiSource, setNewsApiSource] = useState<"auto" | "news" | "github" | "fallback">("auto");
  const [newsGithubRepo, setNewsGithubRepo] = useState<string>("photon1c/pixeloffice");
  const [syncAgentTopics, setSyncAgentTopics] = useState<boolean>(true);
  const [speechBubbles, setSpeechBubbles] = useState<{speakerId: string; text: string; offset?: number; yOffset?: number; model?: string; expiresAt?: number}[]>([]);
  
  // Thought Burst / Loop Detection State
  const [thoughtBurstConfig] = useState({
    maxBurstTokens: 96,
    loopThreshold: 0.7,
    noveltyThreshold: 0.3,
    speechEnabled: true,
  });
  const [agentLoopStates, setAgentLoopStates] = useState<Record<string, {
    state: "healthy" | "stalled" | "looping";
    loopScore: number;
    noveltyScore: number;
    recommendedAction: string;
    lastChecked: number;
  }>>({});
  const [deskStigmergy, setDeskStigmergy] = useState<Record<string, {
    loopHeat: number;
    reviewHeat: number;
    speechActivity: number;
    taskShadow: number;
    observerAttention: number;
    confusionResidue: number;
  }>>({});
  
  // Speech Events & Observer State
  const [recentSpeechEvents, setRecentSpeechEvents] = useState<Array<{
    speaker: string;
    speechText: string;
    topicTags: string[];
    socialWeight: number;
    timestamp: number;
    nearbyResponse?: string;
  }>>([]);
  const [observerHistory, setObserverHistory] = useState<Array<{
    id: string;
    targetAgent: string;
    state: string;
    action: string;
    nextPrompt: string;
    timestamp: number;
  }>>([]);

  // Snapshot from /api/flow for lightweight frontend visualization
  const [flowSnapshot, setFlowSnapshot] = useState<any | null>(null);
  
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
  const workflowState = workflowStateRef.current;

  const lastFrameTime = useRef<number>(0);
  const walkCycleTimer = useRef<number>(0);
  
  const [isScrumRunning, setIsScrumRunning] = useState<boolean>(false);
  const [isCoolerTalkRunning, setIsCoolerTalkRunning] = useState<boolean>(false);
  const [sleepMode, setSleepMode] = useState<boolean>(true);
  const [vacationMode, setVacationMode] = useState<boolean>(false);
  const [vacationStatus, setVacationStatus] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showAgent2Agent, setShowAgent2Agent] = useState<boolean>(true);
  const [showYouTube, setShowYouTube] = useState<boolean>(false);
  const [showReviewHeat, setShowReviewHeat] = useState<boolean>(true);
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  const [showThoughtBursts, setShowThoughtBursts] = useState<boolean>(LAB_MODE);
  const [showInventoryWorkflow, setShowInventoryWorkflow] = useState<boolean>(false);
  const [obsMode, setObsMode] = useState<boolean>(false); // OBS browser 2x scaling
  const [activeWalkUpChats, setActiveWalkUpChats] = useState<Map<string, WalkUpChatSession>>(new Map());
  const agentsRef = useRef(agents);
  agentsRef.current = agents;
  const renderAgentsRef = useRef(agents);
  // CRITICAL: Do NOT sync renderAgentsRef to agents state!
  // Render loop owns movement - syncing resets animation progress on every re-render
  const sleepModeRef = useRef(sleepMode);
  sleepModeRef.current = sleepMode;
  const configRef = useRef(dashboardConfig);
  configRef.current = dashboardConfig;

  // Push lightweight office snapshot to the backend for /api/flow visualizer
  useEffect(() => {
    const interval = setInterval(() => {
      const agentsSnapshot = agentsRef.current;
      const walking = agentsSnapshot.filter(a => a.mode === "walking").length;
      const sitting = agentsSnapshot.filter(a => a.mode === "sitting").length;
      const wandering = agentsSnapshot.filter(a => a.mode === "idle-wander").length;
      const stuck = 0; // No explicit "stuck" mode yet

      // Aggregate moods as emojis per agent id
      const moods: Record<string, string> = {};
      for (const agent of agentsSnapshot) {
        moods[agent.id] = getMoodEmoji(agent.mood);
      }

      fetch("/api/flow/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentCount: agentsSnapshot.length,
          walking,
          sitting,
          wandering,
          stuck,
          coolerActive: activeConversationZone === "kitchen",
          scrumActive: activeConversationZone === "conference",
          sleepMode,
          vacationMode,
          moods,
        }),
      }).catch(() => {
        // Flow visualizer is optional; ignore failures
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [sleepMode, vacationMode, activeConversationZone]);

  // Optional sync: allow AgentIssueMonitor to push its topic/source into
  // the main cooler topic state when enabled.
  useEffect(() => {
    (window as any).updateCoolerTopicFromAgent2Agent = (payload: { topic: string; source: string }) => {
      if (!syncAgentTopics) return;
      if (!payload || !payload.topic) return;
      setCurrentTopic(payload.topic);
      if (payload.source === "auto" || payload.source === "news" || payload.source === "github" || payload.source === "fallback") {
        setNewsApiSource(payload.source as any);
      }
    };

    return () => {
      (window as any).updateCoolerTopicFromAgent2Agent = undefined;
    };
  }, [syncAgentTopics]);

  // Periodically fetch /api/flow for a small frontend flow inspector
  useEffect(() => {
    let cancelled = false;

    const fetchFlow = async () => {
      try {
        const res = await fetch("/api/flow");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setFlowSnapshot(data);
      } catch {
        // Flow inspector is optional; ignore failures
      }
    };

    fetchFlow();
    const interval = setInterval(fetchFlow, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Entrance animation: stagger agents walking to desks
  useEffect(() => {
    if (!entranceActive) return;
    INITIAL_AGENTS.forEach((_, i) => {
      setTimeout(() => {
        setAgents(prev => prev.map((agent, idx) =>
          idx === i ? {
            ...agent,
            mode: "walking",
            targetX: CHAIR_POSITIONS[agent.deskIndex].x,
            targetY: CHAIR_POSITIONS[agent.deskIndex].y,
          } : agent
        ));
      }, 300 + i * 500);
    });
  }, [entranceActive]);

  // Detect when all agents have reached their desks
  useEffect(() => {
    if (!entranceActive) return;
    const allSeated = agents.every(a => {
      const dx = a.x - a.targetX;
      const dy = a.y - a.targetY;
      return Math.sqrt(dx * dx + dy * dy) < 10 && a.mode === "sitting";
    });
    if (allSeated && agents.length > 0) {
      setEntranceActive(false);
      localStorage.setItem("pixel_office_entrance_done", "true");
    }
  }, [agents, entranceActive]);

  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Sync sleep mode to server for more frequent cooler/scrum sessions
  useEffect(() => {
    fetch('/api/office/night-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: sleepMode })
    }).catch(err => console.warn('Night mode sync error:', err));
  }, [sleepMode]);

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
        renderLog.info("Canvas size set", { w: rect.width, h: rect.height });
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);
  
  useEffect(() => {
    // More descriptive loading that actually tracks initialization
    setLoadingStatus("Loading React components...");
    setTimeout(() => {
      setLoadingStatus("Setting up canvas...");
      setTimeout(() => {
        setLoadingStatus("Initializing agent logic...");
        setTimeout(() => {
          setLoadingStatus("Starting render loop...");
          setTimeout(() => {
            setLoadingStatus("Ready!");
            setTimeout(() => setLoadingStatus(""), 500);
          }, 200);
        }, 200);
      }, 200);
    }, 200);
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
    
    const refreshTopic = async () => {
      try {
        const resp = await fetch("/api/cooler/topics/refresh", { method: 'POST' });
        const data = await resp.json();
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
    const topicInterval = setInterval(refreshTopic, 300000); // Refresh news topic every 5 minutes
    return () => {
      clearInterval(interval);
      clearInterval(topicInterval);
    };
  }, []);

  // Fetch Desk Stigmergy State (per thought_speech_stigmergy.md Part B)
  useEffect(() => {
    const fetchDeskStigmergy = async () => {
      try {
        const resp = await fetch("/api/stigmergy/desk/all");
        const data = await resp.json();
        if (data.desks) setDeskStigmergy(data.desks);
      } catch (err) {
        console.warn("Failed to fetch desk stigmergy", err);
      }
    };

    fetchDeskStigmergy();
    const interval = setInterval(fetchDeskStigmergy, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Speech Events & Observer History (per thought_speech_stigmergy.md Parts D & E)
  useEffect(() => {
    const fetchSpeechEvents = async () => {
      try {
        const resp = await fetch("/api/agent/speech/recent?limit=10");
        const data = await resp.json();
        if (data.events) setRecentSpeechEvents(data.events);
      } catch (err) {
        console.warn("Failed to fetch speech events", err);
      }
    };

    const fetchObserverHistory = async () => {
      try {
        const resp = await fetch("/api/agent/observer/history?limit=10");
        const data = await resp.json();
        if (data.interventions) setObserverHistory(data.interventions);
      } catch (err) {
        console.warn("Failed to fetch observer history", err);
      }
    };

    fetchSpeechEvents();
    fetchObserverHistory();
    const interval = setInterval(() => {
      fetchSpeechEvents();
      fetchObserverHistory();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update Desk Stigmergy based on agent state
  useEffect(() => {
    const FINISHED_STATUSES = ["done", "archived", "approved", "ready_for_delivery", "dropped"];
    const pendingUpdates: { deskId: string; updates: Record<string, number> }[] = [];
    
    agents.forEach(agent => {
      const deskId = `desk-${agent.deskIndex}`;
      let taskShadow: number | undefined;
      
      // Check agent loop state
      const loopState = agentLoopStates[agent.id];
      if (loopState) {
        if (loopState.state === "looping") taskShadow = 0.8;
        else if (loopState.state === "stalled") taskShadow = 0.4;
      }
      
      // Check if agent has unfinished tasks (task shadow)
      const agentTasks = tasks.filter(t => t.assigneeId === agent.id);
      const unfinishedTasks = agentTasks.filter(t => !FINISHED_STATUSES.includes(t.status));
      const isIdleWithTasks = agent.status === "idle" && unfinishedTasks.length > 0;
      
      if (isIdleWithTasks) {
        taskShadow = Math.min(0.6 + (unfinishedTasks.length * 0.1), 1);
      }
      
      // Compare with current desk stigmergy to avoid unnecessary updates
      const current = deskStigmergy[deskId];
      const currentTaskShadow = current?.taskShadow || 0;
      const newTaskShadow = taskShadow !== undefined ? taskShadow : 0;
      if (Math.abs(currentTaskShadow - newTaskShadow) > 0.05) {
        pendingUpdates.push({ deskId, updates: { taskShadow: newTaskShadow } });
      }
    });
    
    if (pendingUpdates.length > 0) {
      pendingUpdates.forEach(({ deskId, updates }) => {
        fetch(`/api/stigmergy/desk/${deskId}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        }).catch(() => {});
      });
    }
  }, [agents, agentLoopStates, tasks, deskStigmergy]);

  // Fetch conversation sessions for convo viewer
  useEffect(() => {
    if (!showConvoViewer) {
      setConvoSessions([]); // Clear sessions when viewer closed
      return;
    }
    
    let isMounted = true;
    const fetchSessions = async () => {
      try {
        const resp = await fetch(`/api/cooler/sessions/db?type=${convoViewerType}`);
        const data = await resp.json();
        if (isMounted) {
          // Deduplicate by session_id to prevent React key conflicts
          const sessions = data.sessions || [];
          const uniqueSessions = sessions.filter((s: any, idx: number, arr: any[]) => 
            arr.findIndex(s2 => s2.session_id === s.session_id) === idx
          );
          setConvoSessions(uniqueSessions.slice(0, 50)); // Hard limit
        }
      } catch (err) {
        console.warn("Failed to fetch convo sessions", err);
      }
    };
    
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Reduce polling to 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showConvoViewer, convoViewerType]);

  // Track recent deposit timestamps per agent to prevent duplicates
  const lastShadowDepositRef = useRef<Record<string, number>>({});

  // STIGMERGY: Detect Task Shadows (abandoned work)
  useEffect(() => {
    const now = Date.now();
    const SHADOW_COOLDOWN = 5 * 60 * 1000;
    let changed = false;
    
    agents.forEach(agent => {
      const hasTask = tasks.some(t => t.assigneeId === agent.id && t.status !== "done");
      if (agent.status === "idle" && hasTask) {
        const lastDeposit = lastShadowDepositRef.current[agent.id] || 0;
        if (now - lastDeposit >= SHADOW_COOLDOWN) {
          lastShadowDepositRef.current[agent.id] = now;
          changed = true;
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
      } else if (!hasTask) {
        // Clear deposit tracking when agent has no unfinished tasks
        if (lastShadowDepositRef.current[agent.id]) {
          delete lastShadowDepositRef.current[agent.id];
          changed = true;
        }
      }
    });
  }, [agents, tasks]);

   useEffect(() => {
     if (dashboardConfig.liveMode) {
       const interval = setInterval(fetchStatus, dashboardConfig.pollingInterval);
       return () => clearInterval(interval);
     }
 
      if (dashboardConfig.mockMode) {
          const interval = setInterval(
            () => {
              if (activeConversationZone) return;
              // Sleep mode = MORE activity! Office runs wild while user sleeps
              if (!sleepMode && Math.random() > 0.7) return; // Only throttle when awake

              setAgents((prevAgents) =>
                prevAgents.map((agent) => {
                  // More status changes in sleep mode
                  const newStatus: AgentStatus =
                    sleepMode 
                      ? (Math.random() > 0.2 ? "working" : "idle") // 80% working when sleeping
                      : (Math.random() > 0.3 ? "working" : "idle"); // 70% working when awake
                  return updateAgentStatus(agent, newStatus);
                })
              );
            },
            sleepMode ? 1000 : dashboardConfig.mockToggleSpeed // Faster updates in sleep mode
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
    // Sleep mode = MORE agent conversations and thoughts!
    // Only update renderAgentsRef directly to avoid React re-renders
    const moodInterval = setInterval(() => {
      // When sleeping, 70% chance to continue (more active)
      // When awake, 30% chance to skip (less active due to user presence)
      if (!sleepMode && Math.random() > 0.7) return;
      
      // Update renderAgentsRef directly instead of React state
      // Preserve position data, only update mood/thoughtBubble
      renderAgentsRef.current = renderAgentsRef.current.map((agent) => {
        const randomMood = MOOD_OPTIONS[Math.floor(Math.random() * MOOD_OPTIONS.length)];
        let updated = updateAgentMood(agent, randomMood);
        // More thought bubbles in sleep mode
        const thoughtChance = sleepMode ? 0.7 : 0.5;
        if (Math.random() > (1 - thoughtChance)) updated = generateThoughtBubble(updated);
        // Preserve position and movement state from render loop
        return {
          ...agent, // Keep x, y, mode, targetX, targetY, dir, frame from render loop
          mood: updated.mood,
          thoughtBubble: updated.thoughtBubble
        };
      });
    }, sleepMode ? 2000 : 4000); // Faster updates when sleeping
    return () => clearInterval(moodInterval);
  }, [sleepMode]);

  // Agent conversations (more frequent in sleep mode, occasional otherwise)
  // Updates renderAgentsRef directly to avoid React re-renders
  // Now triggers MORE frequently to enable natural agent interactions
  useEffect(() => {
    if (isTestRunning) return; // Don't start walk-up chats during test
    
    const intervalMs = sleepMode ? 5000 : 12000; // More frequent: 5s/12s (was 8s/25s)
    const convInterval = setInterval(() => {
      const currentAgents = renderAgentsRef.current;
      // Allow standing agents to join conversations too (not just sitting)
      const idle = currentAgents.filter(a => 
        (a.mode === "sitting" || a.mode === "standing") && 
        !a.speechBubble && 
        !activeWalkUpChats.has(a.id)
      );
      if (idle.length < 2) return;
      const initiator = idle[Math.floor(Math.random() * idle.length)];
      const partners = idle.filter(a => a.id !== initiator.id);
      if (partners.length === 0) return;
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const session = initiateWalkUpChat(initiator, partner, new Map());
      if (!session) return;
      setActiveWalkUpChats(prev => { const m = new Map(prev); m.set(session.initiatorId, session); return m; });
      setSpeechBubbles(prev => {
        // Remove any existing bubbles for these agents (prevent duplicates)
        const filtered = prev.filter(b => b.speakerId !== session.initiatorId && b.speakerId !== session.partnerId);
        return [
          ...filtered,
          {
            speakerId: session.initiatorId,
            text: enhanceTextWithEmoji(session.script[0]?.text || "Hey!", currentAgents.find(a => a.id === session.initiatorId)?.mood || "neutral", session.initiatorId),
          }
        ];
      });
      
      // Update renderAgentsRef directly
      renderAgentsRef.current = currentAgents.map(a => {
        if (a.id === session.initiatorId || a.id === session.partnerId) {
          return { ...a, targetX: session.meetPoint.x + (a.id === session.initiatorId ? -20 : 20), targetY: session.meetPoint.y, mode: "standing" as const };
        }
        return a;
      });
    }, intervalMs);
    return () => clearInterval(convInterval);
  }, [sleepMode]);

  // Periodic schedule application (every 30s, plus on hour change)
  useEffect(() => {
    const scheduleInterval = setInterval(() => {
      const h = new Date().getHours();
      if (h !== currentHour) setCurrentHour(h);
      setAgents(prev => applyScheduleToAgents(prev, currentHour));
    }, 30000);
    return () => clearInterval(scheduleInterval);
  }, [currentHour]);

  // Idle agents occasionally stretch or change position for liveliness
  // Updates renderAgentsRef directly to avoid React re-renders
  useEffect(() => {
    const stretchInterval = setInterval(() => {
      renderAgentsRef.current = renderAgentsRef.current.map(agent => {
        if (agent.mode === "sitting" && agent.status === "working" && Math.random() > 0.85) {
          return {
            ...agent,
            thoughtBubble: {
              text: enhanceTextWithEmoji("Stretching...", agent.mood, agent.id),
              expiresAt: Date.now() + 2000
            }
          };
        }
        if (agent.mode === "sitting" && agent.status === "idle" && Math.random() > 0.7) {
          return {
            ...agent,
            thoughtBubble: {
              text: enhanceTextWithEmoji("*looks around*", agent.mood, agent.id),
              expiresAt: Date.now() + 2500
            }
          };
        }
        return agent;
      });
    }, 12000);
    return () => clearInterval(stretchInterval);
  }, []);

  // Advance active walk-up chat dialogues periodically
  // Updates renderAgentsRef directly to avoid React re-renders
  useEffect(() => {
    if (!sleepMode || activeWalkUpChats.size === 0) return;
    // Don't advance walk-up chats if test conversation is running (prevent conflicts)
    if (isTestRunning) return;
    const advanceInterval = setInterval(() => {
      setActiveWalkUpChats(prev => {
        const next = new Map(prev);
        let changed = false;
        next.forEach((session, id) => {
          if (session.finished) {
            next.delete(id); changed = true;
            // Update renderAgentsRef directly
            renderAgentsRef.current = renderAgentsRef.current.map(a =>
              a.id === session.initiatorId || a.id === session.partnerId
                ? { ...a, targetX: CHAIR_POSITIONS[a.deskIndex]?.x || a.x, targetY: CHAIR_POSITIONS[a.deskIndex]?.y || a.y, mode: "walking" as const }
                : a
            );
            return;
          }
          const nextLine = session.currentLine + 1;
          if (nextLine >= session.script.length) {
            next.set(id, { ...session, finished: true, currentLine: nextLine });
            changed = true;
            setSpeechBubbles(prevBubbles => prevBubbles.filter(b => b.speakerId !== session.initiatorId && b.speakerId !== session.partnerId));
            // Update renderAgentsRef directly
            renderAgentsRef.current = renderAgentsRef.current.map(a =>
              a.id === session.initiatorId || a.id === session.partnerId
                ? { ...a, targetX: CHAIR_POSITIONS[a.deskIndex]?.x || a.x, targetY: CHAIR_POSITIONS[a.deskIndex]?.y || a.y, mode: "walking" as const }
                : a
            );
          } else {
            const line = session.script[nextLine];
            setSpeechBubbles(prevBubbles => {
              // Remove existing bubble for THIS speaker only (preserve other conversations)
              const filtered = prevBubbles.filter(b => b.speakerId !== line.speakerId);
              return [
                ...filtered,
                {
                  speakerId: line.speakerId,
                  text: enhanceTextWithEmoji(line.text, "neutral", line.speakerId)
                }
              ];
            });
            next.set(id, { ...session, currentLine: nextLine });
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 4000);
    return () => clearInterval(advanceInterval);
  }, [sleepMode, activeWalkUpChats.size]);

  // Vacation Mode Autopilot: periodically trigger agent2agent, cooler, and scrum sessions
  useEffect(() => {
    if (!vacationMode) return;

    let tickCount = 0;
    // Add jitter to first tick so sessions don't all fire at once on engage
    const initialDelay = 5000 + Math.random() * 15000;

    const scheduleNext = () => {
      // Check if any session is running via ref (test) and DOM button states (cooler/scrum)
      const isAnyRunning = isTestRunningRef.current ||
        document.getElementById("coolertalk-btn")?.getAttribute("disabled") === "" ||
        document.getElementById("scrum-btn")?.getAttribute("disabled") === "";

      if (isAnyRunning) {
        // Wait longer when a session is in progress
        setTimeout(scheduleNext, 15000);
        return;
      }

      tickCount++;
      // Agent2Agent: every ~90s
      if (tickCount % 3 === 0) {
        handleTestConversation();
      }
      // Cooler session: every ~180s
      if (tickCount % 6 === 0) {
        document.getElementById("coolertalk-btn")?.click();
      }
      // Scrum: every ~450s (~7.5 min)
      if (tickCount % 15 === 0) {
        document.getElementById("scrum-btn")?.click();
      }

      const nextDelay = 30000 + Math.random() * 5000;
      setTimeout(scheduleNext, nextDelay);
    };

    const initialTimer = setTimeout(scheduleNext, initialDelay);
    return () => clearTimeout(initialTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacationMode]);

  // Thought Burst Loop Detection (per thought_speech_stigmergy.md Part C)
  useEffect(() => {
    const runLoopDetection = async () => {
      setAgentLoopStates(prev => {
        const next = { ...prev };
        agents.forEach(agent => {
          // Simulate occasional "thinking" text
          if (agent.status === "working" && agent.thoughtBubble) {
            const text = agent.thoughtBubble.text;
            const burstTokenCount = Math.ceil(text.length / 4); // Estimate tokens (~4 chars per token)
            fetch("/api/agent/detect-loop", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                text, 
                burstTokenCount,
                maxBurstTokens: thoughtBurstConfig.maxBurstTokens
              })
            })
            .then(res => res.json())
            .then(data => {
              setAgentLoopStates(prev => ({
                ...prev,
                [agent.id]: {
                  state: data.state || "healthy",
                  loopScore: data.loopScore || 0,
                  noveltyScore: data.noveltyScore || 1,
                  recommendedAction: data.recommendedAction || "continue",
                  lastChecked: Date.now()
                }
              }));
              
              // Update desk loop heat based on detection (rate limited)
              if (data.state === "looping" && agent.id) {
                debouncedDeskUpdates.current.set(`desk-${agent.deskIndex}`, 
                  setTimeout(() => {
                    fetch(`/api/stigmergy/desk/desk-${agent.deskIndex}/update`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ loopHeat: 0.8 })
                    }).catch(() => {});
                  }, 1000)
                );
              }
            })
            .catch(() => {});
          } else {
            // Reset to healthy when not working
            next[agent.id] = { state: "healthy", loopScore: 0, noveltyScore: 1, recommendedAction: "continue", lastChecked: Date.now() };
          }
        });
        return next;
      });
    };

    const loopInterval = setInterval(runLoopDetection, 8000);
    return () => clearInterval(loopInterval);
  }, [agents, thoughtBurstConfig]);

  useEffect(() => {
    const zoneInterval = setInterval(() => {
      // Only update zoneActivity map, don't trigger agent state updates
      const newActivity = new Map<string, ZoneActivity>();
      const currentAgents = agentsRef.current;
      currentAgents.forEach(agent => {
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
    }, 2000);
    return () => clearInterval(zoneInterval);
  }, []);

  // No sync interval - render loop handles all animation directly via renderAgentsRef
  // React state (agents) is only updated for explicit actions (reset, conversations, etc.)
  // This eliminates the flickering caused by constant state sync

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      log.warn("No canvas ref");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      log.warn("No 2d context");
      return;
    }

    let animationFrameId: number;

    const render = (timestamp: number) => {
      frameCountRef.current++;
      
      // Initialize lastFrameTime on first render to prevent NaN deltaTime
      if (lastFrameTime.current === 0) {
        lastFrameTime.current = timestamp;
      }
      
      const deltaTime = Math.min(timestamp - lastFrameTime.current, 100); // Cap at 100ms to prevent teleportation
      lastFrameTime.current = timestamp;

      const currentSleepMode = sleepModeRef.current;
      const currentConfig = configRef.current;

      renderAgentsRef.current = renderAgentsRef.current.map((agent) => {
        const effectiveSpeed = currentSleepMode ? currentConfig.animationSpeed * 0.3 : currentConfig.animationSpeed;
        
        // Suspend wandering for test conversation agents (more order)
        const isTestAgent = testAgentIdsRef.current && (agent.id === testAgentIdsRef.current.visitor || agent.id === testAgentIdsRef.current.host);
        
        let updatedAgent = updateAgentPosition(agent, effectiveSpeed, deltaTime);
        
        // Only apply wander logic if NOT a test agent and NOT in conversation zone
        if (!isTestAgent) {
          updatedAgent = handleWanderLogic(updatedAgent);
        }
        
        if (walkCycleTimer.current > 150 && updatedAgent.mode === "walking") {
          updatedAgent = { ...updatedAgent, frame: updatedAgent.frame === 0 ? 1 : 0 };
          walkCycleTimer.current = 0;
        }
        return updatedAgent;
      });

      const currentAgents = renderAgentsRef.current;

      ctx.save();
      const scaleX = canvas.width / CANVAS_WIDTH;
      const scaleY = canvas.height / CANVAS_HEIGHT;
      const baseScale = Math.min(scaleX, scaleY);
      const scale = obsMode ? baseScale * 2 : baseScale; // OBS mode: 2x zoom
      ctx.scale(scale, scale);

      drawFloor(ctx);
      drawWalls(ctx);
      drawLobby(ctx);
      drawArchives(ctx);
      drawSpecialistSuite(ctx);
      drawConferenceRoom(ctx);
      
      const leslieclaw = currentAgents.find(a => a.id === "leslieclaw");
      drawBossOffice(ctx, leslieclaw?.visibility);
      drawSherlockOffice(ctx);
     
      drawKitchen(ctx);
      drawMissionControl(ctx);
      drawDataNodes(ctx);
      drawCubicles(ctx);
      drawLounge(ctx);
      drawPlants(ctx);

      currentAgents.forEach((agent) => drawDeskItem(ctx, agent));

      const shouldRespectPrivacy = currentConfig.viewMode === "public";
      
      currentAgents.forEach((agent) => {
        if (shouldRespectPrivacy && agent.visibility === "offline") return;
        const speech = speechBubbles.find(sb => sb.speakerId === agent.id);
        drawAgent(ctx, { ...agent, speechBubble: speech ? { text: speech.text, offset: (speech.offset || 0) * 55, expiresAt: 0 } : undefined }, currentConfig.showNames);
      });

      drawZoneIndicators(ctx, zoneActivity, stigmergyTraces);

      if (currentConfig.showStatusBar) {
        drawStatusBar(ctx, currentAgents, shouldRespectPrivacy);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Empty deps - render loop runs independently, uses refs for all dynamic values

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
  if (showCalendar) return <CalendarPanel onClose={() => setShowCalendar(false)} />;
  if (showConvoViewer) {
    return (
      <ConvoViewer 
        sessions={convoSessions} 
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
        type={convoViewerType}
        onChangeType={setConvoViewerType}
        onClose={() => setShowConvoViewer(false)} 
      />
    );
  }

  return (
    <div style={{
      ...styles.container,
      display: 'flex',
      flexDirection: isMobile ? "column" : "row"
    }}>
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 100,
            background: '#1a2a2a',
            border: '1px solid #2a3548',
            color: '#4ecdc4',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '18px',
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          {showMobileSidebar ? '✕' : '☰'}
        </button>
      )}
      
      {/* Right panel toggle (mobile) */}
      {isMobile && (
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 100,
            background: '#1a2a2a',
            border: '1px solid #2a3548',
            color: '#4ecdc4',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          {showRightPanel ? '◀' : '▶'}
        </button>
      )}
      
      <div style={{
        ...styles.sidebar, 
        width: sidebarWidth,
        ...(isMobile && styles.sidebarMobile),
        ...(isMobile && !showMobileSidebar && styles.sidebarHidden)
      }}>
        {isMobile && <div style={{ height: '50px' }} />} {/* Spacer for toggle button */}
        <OfficeClock embedded onHourChange={(hour) => {
          setCurrentHour(hour);
          setAgents(prev => applyScheduleToAgents(prev, hour));
        }} />

        
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '8px 10px', background: '#0f1520', border: '1px solid #1b2333', borderRadius: '6px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#a0a0b0', fontWeight: 600 }}>🌙 Sleep Mode</div>
            <div style={{ fontSize: '8px', color: '#6c757d', marginTop: '2px' }}>{sleepMode ? '💬 impromptu chats • 💭 thoughts • ⚡ faster' : 'normal office hours'}</div>
          </div>
          <button
            onClick={() => setSleepMode(prev => !prev)}
            style={{
              padding: '3px 12px',
              fontSize: '10px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              background: sleepMode ? '#27ae60' : '#2a2a3a',
              color: sleepMode ? '#fff' : '#666',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {sleepMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* VACATION MODE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '8px 10px', background: vacationMode ? '#1a0a20' : '#0f1520', border: vacationMode ? '1px solid #9b59b6' : '1px solid #1b2333', borderRadius: '6px' }}>
          <div>
            <div style={{ fontSize: '11px', color: vacationMode ? '#bb86fc' : '#a0a0b0', fontWeight: 600 }}>✈️ Vacation Mode</div>
            <div style={{ fontSize: '8px', color: '#6c757d', marginTop: '2px' }}>{vacationMode ? (vacationStatus || '🤖 cooler + scrum + a2a autopilot') : 'full office autopilot'}</div>
          </div>
          <button
            onClick={async () => {
              if (vacationMode) {
                setVacationMode(false);
                setVacationStatus('deactivating...');
                try {
                  const resp = await fetch('/api/office/vacation-mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }) });
                  const data = await resp.json();
                  setVacationStatus(data.message || 'deactivated');
                  setSleepMode(false);
                } catch (e) {
                  setVacationStatus('deactivation error');
                }
              } else {
                setVacationMode(true);
                setVacationStatus('activating autopilot...');
                setSleepMode(true);
                try {
                  const resp = await fetch('/api/office/vacation-mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true }) });
                  const data = await resp.json();
                  setVacationStatus(data.message || 'autopilot engaged');
                } catch (e) {
                  setVacationStatus('activation error');
                }
              }
            }}
            style={{
              padding: '3px 12px',
              fontSize: '10px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              background: vacationMode ? '#9b59b6' : '#2a2a3a',
              color: vacationMode ? '#fff' : '#666',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {vacationMode ? 'ENGAGED' : 'OFF'}
          </button>
        </div>
        
        {/* STIGMERGY PANEL */}
        <div style={{ background: "rgba(255, 100, 50, 0.1)", border: "1px solid #ff6432", borderRadius: "4px", padding: "10px", marginBottom: "16px", scrollbarWidth: "thin", scrollbarColor: "#3a3a5a transparent" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ color: "#ff6432", margin: 0, fontSize: "12px" }}>🔥 Review Heat</h4>
            <button onClick={async () => {
              const resp = await fetch("/api/cooler/topics/refresh", { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  source: newsApiSource,
                  repo: newsApiSource === 'github' ? newsGithubRepo : undefined
                })
              });
              const data = await resp.json();
              if (data.topic) {
                const topicValue = typeof data.topic === 'object' ? data.topic.title : data.topic;
                setCurrentTopic(topicValue);
              }
            }} style={styles.iconBtn} title="Refresh news topic">↻</button>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '9px', color: '#ff6432', display: 'block', marginBottom: '3px' }}>Topic Source</label>
            <select 
              value={newsApiSource}
              onChange={async (e) => {
                setNewsApiSource(e.target.value as any);
                const resp = await fetch("/api/cooler/topics/refresh", { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    source: e.target.value,
                    repo: e.target.value === 'github' ? newsGithubRepo : undefined
                  })
                });
                const data = await resp.json();
                if (data.topic) {
                  const topicValue = typeof data.topic === 'object' ? data.topic.title : data.topic;
                  setCurrentTopic(topicValue);
                }
              }}
              style={{ width: '100%', padding: '4px 6px', background: '#1a1a2a', border: '1px solid #ff6432', borderRadius: '3px', color: '#feca57', fontSize: '10px' }}
            >
              <option value="auto">Auto (GitHub → News → Fallback)</option>
              <option value="news">RSS/News Only</option>
              <option value="github">GitHub Activity</option>
              <option value="fallback">Fallback Topics</option>
            </select>
            <div style={{ marginTop: '4px', fontSize: '9px', color: '#feca57', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={syncAgentTopics}
                onChange={e => setSyncAgentTopics(e.target.checked)}
                style={{ margin: 0 }}
              />
              <span>Sync Agent2Agent topics to Cooler sessions</span>
            </div>
          </div>
          {newsApiSource === 'github' && (
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '9px', color: '#ff6432', display: 'block', marginBottom: '3px' }}>GitHub Repo</label>
              <input 
                type="text"
                value={newsGithubRepo}
                onChange={(e) => setNewsGithubRepo(e.target.value)}
                placeholder="owner/repo"
                style={{ width: '100%', padding: '4px 6px', background: '#1a1a2a', border: '1px solid #ff6432', borderRadius: '3px', color: '#feca57', fontSize: '10px', boxSizing: 'border-box' }}
              />
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#feca57', marginBottom: '8px', fontStyle: 'italic' }}>Topic: {currentTopic || "Loading..."}</div>
          {stigmergyTraces.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255, 100, 50, 0.2)", paddingTop: "8px" }}>
              {stigmergyTraces.slice(0, 10).map((t, i) => (
                <div key={t.id || `${t.type}-${t.roomId}-${t.agentId || i}-${i}`} style={{ fontSize: "10px", color: "#e8e8f0", marginBottom: "4px" }}>
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

          {/* Flow Snapshot - Lab Mode Only */}
          {LAB_MODE && flowSnapshot && (
            <div style={{ borderTop: "1px solid rgba(100, 200, 255, 0.2)", paddingTop: "8px", marginTop: "8px" }}>
              <div style={{ fontSize: '10px', color: '#6495ed', marginBottom: '6px', fontWeight: 600 }}>🌐 Flow Snapshot</div>
              <div style={{ fontSize: '9px', color: '#a0a0b0' }}>
                <div>Agents: {flowSnapshot.office?.activeAgents ?? 0}</div>
                <div>Movement: W {flowSnapshot.movement?.walkingAgents ?? 0} · S {flowSnapshot.movement?.sittingAgents ?? 0} · WN {flowSnapshot.movement?.wanderingAgents ?? 0}</div>
                <div>Cooler: {flowSnapshot.office?.coolerActive ? 'active' : 'idle'} · SCRUM: {flowSnapshot.office?.scrumActive ? 'active' : 'idle'}</div>
                <div style={{ marginTop: '4px' }}>Last update: {flowSnapshot.office?.updatedAt || flowSnapshot.timestamp}</div>
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
                // Deduplicate by agentId+roomId to prevent duplicate entries
                const seen = new Set<string>();
                const uniqueShadows = shadowTraces.filter(t => {
                  const key = `${t.agentId || 'unknown'}|${t.roomId || ''}|${t.type}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
                // Group by agent and calculate average intensity
                const byAgent: Record<string, { count: number; totalIntensity: number; roomId: string }> = {};
                uniqueShadows.forEach(t => {
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
          

          
          {/* Observer / Thought Burst Panel - Lab Mode Only */}
          {LAB_MODE && (
            <div style={{ borderTop: "1px solid rgba(100, 200, 255, 0.2)", paddingTop: "8px", marginTop: "8px" }}>
              <div style={{ fontSize: '10px', color: '#6495ed', marginBottom: '6px', fontWeight: 600 }}>🧠 Thought Bursts</div>
              
              {/* Loop Detection Status */}
              {Object.keys(agentLoopStates).length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {agents.slice(0, 4).map(agent => {
                    const loopState = agentLoopStates[agent.id];
                    if (!loopState) return null;
                    const stateColor = loopState.state === 'looping' ? '#ff6b6b' : loopState.state === 'stalled' ? '#feca57' : '#26de81';
                    return (
                      <div key={agent.id} style={{ fontSize: '8px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                        <span style={{ color: '#a0a0b0', minWidth: '60px' }}>{agent.name}</span>
                        <span style={{ 
                          padding: '1px 4px', 
                          borderRadius: '2px', 
                          background: stateColor + '33',
                          color: stateColor,
                          textTransform: 'uppercase',
                          fontSize: '7px'
                        }}>{loopState.state}</span>
                        <span style={{ color: '#606070' }}>L:{loopState.loopScore.toFixed(2)} N:{loopState.noveltyScore.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Desk Stigmergy Indicators */}
              {Object.keys(deskStigmergy).length > 0 && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(100, 200, 255, 0.1)' }}>
                  <div style={{ fontSize: '8px', color: '#808090', marginBottom: '4px' }}>Desk Heat</div>
                  {Object.entries(deskStigmergy).slice(0, 6).map(([deskId, heat]) => {
                    const totalHeat = heat.loopHeat + heat.reviewHeat + heat.speechActivity + heat.taskShadow + heat.observerAttention;
                    if (totalHeat < 0.1) return null;
                    
                    // Hotspot glow effect for high heat
                    const isHotspot = totalHeat > 1.5;
                    const glowStyle = isHotspot ? {
                      boxShadow: `0 0 ${Math.min(totalHeat * 4, 12)}px rgba(255, 107, 107, ${Math.min(totalHeat / 3, 0.6)})`,
                      borderRadius: '4px',
                      padding: '3px',
                      background: 'rgba(255, 107, 107, 0.1)'
                    } : {};
                    
                    return (
                      <div key={deskId} style={{ marginBottom: '6px', ...glowStyle }}>
                        <div style={{ fontSize: '7px', color: '#606070', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{deskId}</span>
                          <span style={{ color: isHotspot ? '#ff6b6b' : '#808090' }}>{totalHeat.toFixed(1)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '3px', height: '6px' }}>
                          <div style={{ flex: heat.loopHeat || 0.1, background: heat.loopHeat > 0.3 ? '#ff6b6b' : '#2a3a4a', borderRadius: '2px', minWidth: '2px' }} title={`loopHeat: ${heat.loopHeat.toFixed(2)}`} />
                          <div style={{ flex: heat.reviewHeat || 0.1, background: heat.reviewHeat > 0.3 ? '#feca57' : '#2a3a4a', borderRadius: '2px', minWidth: '2px' }} title={`reviewHeat: ${heat.reviewHeat.toFixed(2)}`} />
                          <div style={{ flex: heat.speechActivity || 0.1, background: heat.speechActivity > 0.3 ? '#4ecdc4' : '#2a3a4a', borderRadius: '2px', minWidth: '2px' }} title={`speechActivity: ${heat.speechActivity.toFixed(2)}`} />
                          <div style={{ flex: heat.taskShadow || 0.1, background: heat.taskShadow > 0.3 ? '#a55eea' : '#2a3a4a', borderRadius: '2px', minWidth: '2px' }} title={`taskShadow: ${heat.taskShadow.toFixed(2)}`} />
                          <div style={{ flex: heat.observerAttention || 0.1, background: heat.observerAttention > 0.3 ? '#26de81' : '#2a3a4a', borderRadius: '2px', minWidth: '2px' }} title={`observerAttention: ${heat.observerAttention.toFixed(2)}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div style={{ fontSize: '8px', color: '#505060', marginTop: '6px' }}>
                Max tokens: {thoughtBurstConfig.maxBurstTokens} • Loop threshold: {thoughtBurstConfig.loopThreshold}
              </div>
              
              {/* Recent Speech Events */}
              {recentSpeechEvents.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(100, 200, 100, 0.1)' }}>
                  <div style={{ fontSize: '8px', color: '#4ecdc4', marginBottom: '4px' }}>💬 Recent Speech</div>
                  {recentSpeechEvents.slice(-3).map((event, idx) => (
                    <div key={idx} style={{ fontSize: '7px', color: '#a0a0b0', marginBottom: '3px', borderLeft: '2px solid #4ecdc4', paddingLeft: '4px' }}>
                      <span style={{ color: '#4ecdc4' }}>{event.speaker}:</span> {event.speechText.slice(0, 40)}...
                      {event.nearbyResponse && (
                        <span style={{ color: '#feca57', marginLeft: '4px' }}>→ {event.nearbyResponse}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Observer Interventions */}
              {observerHistory.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(200, 100, 100, 0.1)' }}>
                  <div style={{ fontSize: '8px', color: '#ff6b6b', marginBottom: '4px' }}>👁️ Observer</div>
                  {observerHistory.slice(-2).map((obs, idx) => {
                    const actionColor = obs.action === 'interrupt' ? '#ff6b6b' : obs.action === 'reanchor' ? '#feca57' : '#26de81';
                    return (
                      <div key={idx} style={{ fontSize: '7px', color: '#a0a0b0', marginBottom: '3px' }}>
                        <span style={{ color: actionColor }}>{obs.action}</span> on {obs.targetAgent}: {obs.nextPrompt.slice(0, 30)}...
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button id="editor-btn" style={{...styles.paramsToggle, background: showEditor ? '#1a2a2a' : '#0a0a12', borderColor: '#9b59b6'}} onClick={() => setShowEditor(!showEditor)}>
            {showEditor ? "▼ Editor" : "▶ Editor"}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button 
            id="inventory-workflow-btn"
            style={{...styles.paramsToggle, background: showInventoryWorkflow ? '#1a2a2a' : '#0a0a12', borderColor: '#ff6b6b'}} 
            onClick={() => setShowInventoryWorkflow(!showInventoryWorkflow)}
          >
            {showInventoryWorkflow ? "▼ Inventory" : "▶ Inventory"}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button 
            id="starbucks-inventory-btn"
            style={{...styles.paramsToggle, background: '#d35400', color: '#fff', fontWeight: 700, border: '2px solid #e67e22'}} 
            onClick={() => {
              console.log("[Starbucks Inventory] Starting Starbucks inventory test flow");
              setShowInventoryWorkflow(true);
              // Trigger the inventory workflow automatically
              const event = new CustomEvent('start-inventory-workflow', { detail: { type: 'starbucks' } });
              window.dispatchEvent(event);
            }}
          >
            ☕ Starbucks Inventory Test
          </button>
        </div>

         <div style={{ marginBottom: '16px' }}>
          <button id="coolertalk-btn" style={{...styles.paramsToggle, background: '#7c5cbf', opacity: (!currentTopic || currentTopic === "" || isScrumRunning || isCoolerTalkRunning) ? 0.5 : 1}} disabled={!currentTopic || currentTopic === "" || isScrumRunning || isCoolerTalkRunning} onClick={() => {
            setIsCoolerTalkRunning(true);
            setActiveConversationZone("kitchen");
            
            const kitchenPositions = [
              { x: 1030, y: 80 },
              { x: 1080, y: 80 },
              { x: 1130, y: 80 },
              { x: 1055, y: 130 },
            ];
            // Select a small group (up to 3) for this cooler session.
            const allAgents = agentsRef.current;
            const shuffled = [...allAgents].sort(() => Math.random() - 0.5);
            const participatingAgents = shuffled.slice(0, Math.min(3, shuffled.length));
            
            // Clear previous bubbles
            setSpeechBubbles([]);
            
            // CRITICAL: Update renderAgentsRef.current directly for visual movement
            renderAgentsRef.current = renderAgentsRef.current.map((agent) => {
              const participantIdx = participatingAgents.findIndex(a => a.id === agent.id);
              if (participantIdx >= 0) {
                const pos = kitchenPositions[participantIdx];
                return { ...agent, targetX: pos.x, targetY: pos.y, mode: "walking", dir: pos.x > agent.x ? "right" : "left" };
              }
              return agent;
            });
            
            // DO NOT call setAgents() - it triggers re-render which resets movement!
            // Render loop owns all movement.
            
            // Emit routes to router visualizer for each participant
            participatingAgents.forEach((agent, idx) => {
              fetch('http://localhost:5007/api/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from: "FRONTDESK",
                  to: "KITCHEN",
                  confidence: 0.95,
                  model: "local",
                  task_id: `cooler-${Date.now()}-${idx}`,
                  route_type: "cooler_session",
                  participant: agent.name,
                  topic: currentTopic
                })
              }).catch(err => console.log('[Router] Cooler route emit failed:', err.message));
            });
            
            // Simulate conversation with stacked bubbles (50px vertical spacing)
            const conversationLines = [
              { text: `So about "${currentTopic.slice(0, 50)}..."`, delay: 1000 },
              { text: "Interesting point! What do you think?", delay: 2500 },
              { text: "I think we should investigate further.", delay: 4000 },
              { text: "Agreed. Let's bring this to SCRUM.", delay: 5500 },
            ];
            
            conversationLines.forEach((line, i) => {
              const timeoutId = setTimeout(() => {
                if (participatingAgents.length === 0) return;
                const speaker = participatingAgents[i % participatingAgents.length];
                const agentId = speaker.id;
                const bubbleStackIndex = i % Math.min(4, participatingAgents.length);
                const verticalSpacing = 50;
                const yOffset = -20 - (bubbleStackIndex * verticalSpacing);
                
                setSpeechBubbles(prev => {
                  // Remove old bubbles for participating agents, keep max 4 stacked (prevent duplicates)
                  const filtered = prev.filter(b => !participatingAgents.find(a => a.id === b.speakerId));
                  return [
                    ...filtered,
                    {
                      speakerId: agentId,
                      text: line.text,
                      offset: bubbleStackIndex * 55,
                      yOffset: yOffset
                    }
                  ];
                });
              }, line.delay);
              // Track timeout for cleanup
            });
            
            fetch('/api/rooms/kitchen/cooler/run-turn', {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic: currentTopic, participants: participatingAgents.map(a => a.name) })
            }).then(r => r.json()).then(data => {
              console.log("[CoolerTalk] Response:", data);
              console.log("[CoolerTalk] Topic sent:", currentTopic);
              
              // Emit session results to router visualizer
              if (data && data.summary) {
                fetch('http://localhost:5007/api/route', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    from: "KITCHEN",
                    to: "ARCHIVE",
                    confidence: 0.92,
                    model: "local",
                    task_id: `cooler-result-${Date.now()}`,
                    route_type: "cooler_complete",
                    summary: data.summary?.slice(0, 100) || "Session archived"
                  })
                }).catch(err => console.log('[Router] Cooler result emit failed:', err.message));
              }
            }).catch(err => {
              console.error("[CoolerTalk] Error:", err);
            }).finally(() => {
              // Agents hang out in kitchen for 15 seconds before returning (realistic cooler talk duration)
              setTimeout(() => {
                setIsCoolerTalkRunning(false);
                setActiveConversationZone(null);
                // CRITICAL: Update renderAgentsRef.current directly for visual movement
                // Must use "walking" mode so agents actually move back to desks
                renderAgentsRef.current = renderAgentsRef.current.map(agent => {
                  const participantIdx = participatingAgents.findIndex(a => a.id === agent.id);
                  if (participantIdx >= 0) {
                    return {
                      ...agent,
                      targetX: CHAIR_POSITIONS[agent.deskIndex]?.x || agent.x,
                      targetY: CHAIR_POSITIONS[agent.deskIndex]?.y || agent.y,
                      mode: "walking"
                    };
                  }
                  return agent;
                });
                // DO NOT call setAgents() - triggers re-render that resets movement!
                // Clear bubbles
                setSpeechBubbles([]);
              }, 15000); // 15 second hangout time
            });
          }}>Cooler Talk</button>
          {!currentTopic && <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: '4px' }}>Loading topic...</div>}
          {currentTopic && <div style={{ fontSize: '10px', color: '#feca57', marginTop: '4px', fontStyle: 'italic' }}>Topic: {currentTopic}</div>}
        </div>

        <div style={{ marginBottom: '12px', background: '#0f1520', border: '1px solid #1b2333', borderRadius: '6px', padding: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#2ecc71', fontWeight: 600 }}>SCRUM Settings</span>
            <button
              onClick={() => setShowScrumSettings(!showScrumSettings)}
              style={{
                padding: '2px 6px',
                fontSize: '9px',
                background: showScrumSettings ? '#2ecc71' : '#495057',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {showScrumSettings ? '▼' : '▶'}
            </button>
          </div>
          
          {showScrumSettings && (
            <>
              <input
                placeholder="Repo (e.g., photon1c/pixeloffice)"
                value={scrumRepo}
                onChange={(e) => setScrumRepo(e.target.value)}
                style={{ width: '100%', fontSize: '10px', padding: '4px', background: '#2a2a3a', color: 'white', border: '1px solid #444', borderRadius: '3px', marginBottom: '4px', boxSizing: 'border-box' }}
              />
              <input
                placeholder="Task (e.g., review sprint issues)"
                value={scrumTask}
                onChange={(e) => setScrumTask(e.target.value)}
                style={{ width: '100%', fontSize: '10px', padding: '4px', background: '#2a2a3a', color: 'white', border: '1px solid #444', borderRadius: '3px', marginBottom: '6px', boxSizing: 'border-box' }}
              />
            </>
          )}
          
          <button id="scrum-btn" style={{width: '100%', padding: '6px', background: '#2ecc71', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 600, opacity: (isScrumRunning || isCoolerTalkRunning) ? 0.5 : 1}} disabled={isScrumRunning || isCoolerTalkRunning} onClick={async () => {
            setIsScrumRunning(true);
            setActiveConversationZone("conference");
            
            // CRITICAL: Update renderAgentsRef.current directly for visual movement
            // Pick a randomized group for SCRUM so not all agents always
            // participate and they still mostly hang around their desks.
            const allAgents = agentsRef.current;
            const maxScrumAgents = Math.min(8, allAgents.length);
            const shuffled = [...allAgents].sort(() => Math.random() - 0.5);
            const confAgents = shuffled.slice(0, maxScrumAgents);
            renderAgentsRef.current = renderAgentsRef.current.map((agent, idx) => {
              if (confAgents.find(a => a.id === agent.id)) {
                const pos = getConferencePosition(idx);
                return { ...agent, targetX: pos.x, targetY: pos.y, mode: "walking", dir: pos.x > agent.x ? "right" : "left" };
              }
              return agent;
            });
            // DO NOT call setAgents() - triggers re-render that resets movement!
            
            // Emit routes to router visualizer for SCRUM session start
            confAgents.forEach((agent, idx) => {
              fetch('http://localhost:5007/api/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from: "DESK",
                  to: "CONFERENCE",
                  confidence: 0.98,
                  model: "local",
                  task_id: `scrum-${Date.now()}-${idx}`,
                  route_type: "scrum_session",
                  participant: agent.name,
                  role: idx === 0 ? "scrum_master" : "team_member"
                })
              }).catch(err => console.log('[Router] SCRUM route emit failed:', err.message));
            });
            
            try {
              // Test a random pending scrum - no repo/task required
              const topic = currentTopic || "Daily standup";
              
              const scrumRes = await fetch('/api/scrum/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, coolerSessionId: undefined })
              });
              const scrumData = await scrumRes.json();
              
              console.log('[TEST SCRUM] Response:', scrumData);
              
              if (scrumData.assignments && scrumData.assignments.length > 0) {
                const assignmentMap = new Map(scrumData.assignments.map((a: any) => [a.agentId, { targetX: a.targetX, targetY: a.targetY }]));
                // Update renderAgentsRef for visual movement
                renderAgentsRef.current = renderAgentsRef.current.map(agent => {
                  const assignment = assignmentMap.get(agent.id);
                  if (assignment) {
                    return { ...agent, targetX: assignment.targetX, targetY: assignment.targetY, mode: "standing" as const };
                  }
                  return agent;
                });
                // DO NOT call setAgents() - triggers re-render that resets movement!
                
                // Emit SCRUM results to router visualizer
                fetch('http://localhost:5007/api/route', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    from: "CONFERENCE",
                    to: "SCRUM_BOARD",
                    confidence: 0.95,
                    model: "local",
                    task_id: `scrum-result-${Date.now()}`,
                    route_type: "scrum_complete",
                    assignments: scrumData.assignments?.length || 0,
                    summary: scrumData.summary?.slice(0, 100) || "SCRUM complete"
                  })
                }).catch(err => console.log('[Router] SCRUM result emit failed:', err.message));
              }
            } catch (err) {
              console.error('[TEST SCRUM] Error:', err);
            }
            
            // SCRUM meeting lasts 20-25 seconds (realistic standup duration)
            setTimeout(() => {
              setIsScrumRunning(false);
              setActiveConversationZone(null);
              // Update renderAgentsRef for visual movement
              // Must use "walking" mode so agents actually move back to desks
              renderAgentsRef.current = renderAgentsRef.current.map(agent => ({
                ...agent,
                targetX: CHAIR_POSITIONS[agent.deskIndex]?.x || agent.x,
                targetY: CHAIR_POSITIONS[agent.deskIndex]?.y || agent.y,
                mode: "walking"
              }));
              // DO NOT call setAgents() - triggers re-render that resets movement!
            }, 20000); // 20 second SCRUM duration
          }}>TEST SCRUM</button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <a href="/model-health" target="_blank" style={{...styles.paramsToggle, background: '#4a5568', display: 'inline-block', textDecoration: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px'}}>
            Model Health
          </a>
        </div>

        {showParams && <Dashboard config={dashboardConfig} onUpdate={updateConfig} onOpenGenealogyLab={() => setShowGenealogyLab(true)} onOpenAdminAssistant={() => setShowAdminAssistant(true)} onOpenStockForecasts={() => setShowStockForecasts(true)} onOpenConvoViewer={() => { setConvoViewerType("cooler"); setShowConvoViewer(true); }} />}
        {showTimeTasks && <TimeTasksPanel onClose={() => setShowTimeTasks(false)} />}
        {showScrum && <ScrumPanel />}
        {showChat && <ChatOverlay currentTopic={currentTopic} onClose={() => setShowChat(false)} />}
        {showInventoryWorkflow && <InventoryWorkflowDemo 
          onComplete={() => console.log("[Inventory] Workflow complete")}
          onAnimateAgents={(step, positions) => {
            console.log("[Inventory] Animate agents for step:", step, positions);
            // Update agent positions for inventory workflow
            renderAgentsRef.current = renderAgentsRef.current.map(agent => {
              const pos = positions.find(p => p.id === agent.id);
              if (pos) {
                return {
                  ...agent,
                  targetX: pos.x,
                  targetY: pos.y,
                  mode: "walking" as const,
                  dir: pos.x > agent.x ? "right" : "left",
                  status: "working" as const
                };
              }
              return agent;
            });
            // DO NOT call setAgents() - triggers re-render that resets movement!
          }}
        />}
      </div>

      <div style={styles.mainContent}>
        <div style={styles.canvasWrapper} ref={containerRef}>
          <canvas ref={canvasRef} style={styles.canvas} onClick={handleCanvasClick} />
          {loadingStatus && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(5, 5, 9, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
            }}>
              <div style={{color: '#4ecdc4', fontSize: '24px', fontFamily: "'JetBrains Mono', monospace"}}>
                Loading Pixel Office...
              </div>
              <div style={{
                width: '300px',
                height: '8px',
                background: '#1a2a3a',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '30%',
                  background: 'linear-gradient(90deg, #4ecdc4, #26de81, #4ecdc4)',
                  borderRadius: '4px',
                  animation: 'loadingSlide 1.5s ease-in-out infinite',
                }} />
              </div>
              <div style={{color: '#707080', fontSize: '14px'}}>
                {loadingStatus}
              </div>
              <style>{`
                @keyframes loadingSlide {
                  0% { left: -30%; }
                  100% { left: 100%; }
                }
              `}</style>
            </div>
          )}
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
        {!isMobile || (isMobile && showRightPanel) ? (
        <div style={{ 
          width: isMobile ? '100%' : '260px', 
          height: '100%', 
          background: '#0a0a12', 
          borderLeft: '1px solid #1b2333', 
          padding: '10px', 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto', 
          flexShrink: 0, 
          gap: '8px',
          ...(isMobile && { position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 50, width: '100%', maxWidth: '320px' })
        }}>
          {isMobile && <div style={{ height: '50px' }} />} {/* Spacer for toggle button */}
          <div style={{ background: '#0f1520', borderRadius: '6px', padding: '8px', border: '1px solid #1b2333', marginBottom: '8px' }}>
            <StabilityMonitor 
              visible={true}
              metrics={{ cpu: Math.round(cpu), memory: Math.round(memory), fps }}
              onReset={handleReset}
              resetInterval={resetInterval}
              onResetIntervalChange={setResetInterval}
            />
          </div>
          <div style={{ background: '#0f1520', borderRadius: '6px', padding: '8px', border: '1px solid #1b2333' }}>
            <TSAHealthPanel visible={true} embedded agentActivities={agents.map(a => {
              let activity: "thinking" | "speaking" | "acting" | "idle" = "idle";
              let detail: string | undefined;
              if (a.speechBubble) { activity = "speaking"; detail = a.speechBubble.text?.slice(0, 40); }
              else if (a.thoughtBubble) { activity = "thinking"; detail = a.thoughtBubble.text?.slice(0, 40); }
              else if (a.mode === "walking") { activity = "acting"; detail = "moving"; }
              return { id: a.id, name: a.name, activity, detail };
            })} />
          </div>
          <div style={{ borderTop: '1px solid #1b2333', paddingTop: '8px' }}>
            <AgentIssueMonitor visible={true} embedded onTestConversation={handleTestConversation} />
          </div>
          <div style={{ borderTop: '1px solid #1b2333', paddingTop: '8px' }}>
            <button
              onClick={() => setShowCalendar(true)}
              style={{
                width: '100%', padding: '8px', background: '#1a2a2a',
                border: '1px solid #2a3548', borderRadius: '6px',
                color: '#4ecdc4', cursor: 'pointer', fontSize: '12px',
                fontWeight: 600, marginBottom: '8px',
              }}
            >
              📅 Calendar
            </button>
            <YouTubePlayer />
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Dashboard({ config, onUpdate, onOpenGenealogyLab, onOpenAdminAssistant, onOpenStockForecasts, onOpenConvoViewer }: any) {
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
          <button style={styles.secondaryBtn} onClick={onOpenConvoViewer}>Convo Viewer</button>
        </>
      )}
    </div>
  );
}

function AgentActionCard({ agent, card, workflowState, setWorkflowState, onClose, onMoodChange, tasks }: any) {
  const unassignedTasks = tasks?.filter((t: any) => !t.assigneeId) || [];
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  // Default to the agent's configured primary model from opencode-local-agents.json
  const defaultModel = card?.models?.primary?.name || "gemma-3-1b-it";
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [githubRepo, setGithubRepo] = useState("photon1c/pixeloffice");
  const [localGithubLoading, setLocalGithubLoading] = useState(false);
  const [localGithubError, setLocalGithubError] = useState<string | null>(null);
  const [localGithubResult, setLocalGithubResult] = useState<any>(null);
  const [ollamaModels, setOllamaModels] = useState<Array<{id: string; name: string}>>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  
  useEffect(() => {
    fetchOllamaModels().then(setOllamaModels);
    // Fetch ALL models from health endpoint
    fetch('/api/models/health').then(r => r.json()).then(d => setAllModels(d.models || [])).catch(() => {});
  }, []);
  
const isReceptionist = agent.role === "receptionist";
  
  // State for showing all models vs onboarding only
  const [showAllModels, setShowAllModels] = useState(false);
  
  // Load onboarding models from config (cached)
  const onboardingModelsRef = useRef<string[]>([]);
  if (onboardingModelsRef.current.length === 0) {
    // Parse onboarding models from the JSON config
    const onboardingConfig = `deepseek-ai/deepseek-v3.1-terminus
moonshotai/kimi-k2-instruct-0905
deepseek-ai/deepseek-v3.2
mistralai/mistral-large-3-675b-instruct-2512
google/gemma-7b
microsoft/phi-3-mini-128k-instruct
upstage/solar-10.7b-instruct
stepfun-ai/step-3.5-flash`;
    onboardingModelsRef.current = onboardingConfig.split('\n').filter(m => m.trim());
  }
  const onboardingModels = onboardingModelsRef.current;
  
  // Get all online Ollama models (always show all)
  const ollamaOnly = allModels.filter((m: any) => m.provider === 'ollama' && m.status === 'online');
  
  // NVIDIA models - filter based on toggle
  const allNvidia = allModels.filter((m: any) => m.provider === 'nvidia' && m.status === 'online');
  const nvidiaOnly = showAllModels 
    ? allNvidia 
    : allNvidia.filter((m: any) => onboardingModels.includes(m.id));
  
  // Available models - show all Ollama + filtered NVIDIA
  const availableModels: Array<{id: string; name: string}> = [
    ...ollamaOnly.map((m: any) => ({ id: m.id, name: m.name })),
    ...nvidiaOnly.map((nv: any) => ({ id: nv.id, name: `NVIDIA ${nv.name}` }))
  ];
  
  // Toggle checkbox UI
  const toggleStyle: React.CSSProperties = {
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px',
    marginTop: '8px',
    fontSize: '11px',
    color: '#8b9cb5'
  };
  
  // Also check if there's a global NVIDIA availability for additional options
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

  // Visual pipeline steps for GitHub workflows
  const workflowSteps = [
    { agent: "frontdesk", message: "Receptionist processing request...", delay: 2000 },
    { agent: "openclaw", message: "Clerk routing to specialist...", delay: 2500 },
    { agent: "zeroclaw", message: "Specialist fetching from GitHub...", delay: 3000 },
    { agent: "hermitclaw", message: "Archivist archiving results...", delay: 2000 },
  ];

  const runVisualWorkflow = async () => {
    if (!githubRepo.includes('/')) {
      setLocalGithubError("Invalid repo format. Use owner/repo");
      return;
    }
    
    const [owner, repo] = githubRepo.split('/');
    setLocalGithubLoading(true);
    setLocalGithubError(null);
    
    for (let i = 0; i < workflowSteps.length; i++) {
      const step = workflowSteps[i];
      setWorkflowState({
        taskId: "github-readme",
        currentStep: i,
        totalSteps: workflowSteps.length,
        currentAgent: step.agent,
        status: "running",
        message: step.message
      });
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
    
    try {
      const response = await fetch('http://localhost:4173/api/workflow/github/readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo })
      });
      
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const data = await response.json();
      
      setWorkflowState({
        taskId: "github-readme",
        currentStep: workflowSteps.length,
        totalSteps: workflowSteps.length,
        currentAgent: "hermitclaw",
        status: "completed",
        message: "Workflow complete!"
      });
      
      console.log('[GitHub] README fetched, length:', data.response?.length || 0);
      setLocalGithubResult(data);
      
    } catch (err: any) {
      console.error("GitHub workflow error:", err);
      setLocalGithubError(err.message || "Failed to fetch README");
      setWorkflowState({
        taskId: "github-readme",
        currentStep: 0,
        totalSteps: workflowSteps.length,
        currentAgent: "zeroclaw",
        status: "failed",
        message: "Workflow failed"
      });
    } finally {
      setLocalGithubLoading(false);
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

        {/* HermitClaw workspace link and status */}
        {agent.id === 'hermitclaw' && (
          <div style={{...actionCardStyles.statusRow, background: '#1a2538', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px'}}>
            <span style={{...actionCardStyles.statusDot, background: '#26de81'}} />
            <span style={actionCardStyles.statusText}>Online (port 8003)</span>
            <a 
              href="http://127.0.0.1:8003" 
              target="_blank" 
              rel="noreferrer"
              style={{ marginLeft: 'auto', fontSize: '11px', color: '#4ecdc4', textDecoration: 'none' }}
            >
              🌐 Server ↗
            </a>
          </div>
        )}

        {/* IronClaw instance link and status */}
        {agent.id === 'ironclaw' && (
          <div style={{...actionCardStyles.statusRow, background: '#1a2538', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px'}}>
            <span style={{...actionCardStyles.statusDot, background: '#26de81'}} />
            <span style={actionCardStyles.statusText}>Online (port 3008)</span>
            <a 
              href="http://127.0.0.1:3008" 
              target="_blank" 
              rel="noreferrer"
              style={{ marginLeft: 'auto', fontSize: '11px', color: '#4ecdc4', textDecoration: 'none' }}
            >
              🔗 IronClaw ↗
            </a>
          </div>
        )}

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
                    console.log('[Workflow] Write README - not implemented yet');
                  } else if (value === 'sitrep') {
                    console.log('[Workflow] SitRep - not implemented yet');
                  } else if (value === 'nightly') {
                    console.log('[Workflow] Nightly report - coming soon');
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

        {localGithubError && (
          <div style={actionCardStyles.section}>
            <div style={{color: '#fc5c65', fontSize: '13px', textAlign: 'center', padding: '12px', background: '#1a0a0a', borderRadius: '6px'}}>
              {localGithubError}
            </div>
          </div>
        )}

        {localGithubResult && (
          <WorkflowResultPanel 
            result={localGithubResult} 
            onClose={() => setLocalGithubResult(null)} 
          />
        )}

        {localGithubLoading && !workflowState && (
          <div style={actionCardStyles.section}>
            <div style={{color: '#4ecdc4', fontSize: '13px', textAlign: 'center', padding: '12px'}}>
              Receptionist is processing your GitHub request...
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
          <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
            <input style={actionCardStyles.chatInput} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder={`Ask ${agent.name}...`} />
            <button style={actionCardStyles.chatSendBtn} onClick={handleSendChat} disabled={isLoading}>Send</button>
          </div>
          <div style={actionCardStyles.chatMessages}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{...actionCardStyles.chatMessage, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "#1a3a3a" : "#0f1520", border: msg.role === "user" ? "1px solid #4ecdc4" : "1px solid #2a3a4a"}}>
                {msg.content}
              </div>
            ))}
            {isLoading && <div style={{color: '#4ecdc4', fontSize: '12px'}}>Thinking...</div>}
          </div>
          <div style={actionCardStyles.modelSelect}>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={actionCardStyles.modelDropdown}>
              {availableModels.map(model => (<option key={model.id} value={model.id}>{model.name}</option>))}
            </select>
            <label style={toggleStyle}>
              <input type="checkbox" checked={showAllModels} onChange={(e) => setShowAllModels(e.target.checked)} />
              View all {nvidiaOnly.length} models
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

const workflowResultStyles: Record<string, React.CSSProperties> = {
  container: {
    background: "#0f1520",
    border: "1px solid #2a3a4a",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  statusPill: {
    padding: "3px 10px",
    borderRadius: "12px",
    color: "#050509",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  summary: {
    color: "#a0a0b0",
    fontSize: "13px",
    flex: 1,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#606070",
    fontSize: "18px",
    cursor: "pointer",
  },
  preview: {
    background: "#050509",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "12px",
    maxHeight: "200px",
    overflow: "auto",
  },
  previewText: {
    margin: 0,
    color: "#c0c0d0",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  expandBtn: {
    background: "transparent",
    border: "none",
    color: "#4ecdc4",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "8px",
  },
  worklogSection: {
    borderTop: "1px solid #2a3a4a",
    paddingTop: "12px",
  },
  worklogToggle: {
    background: "transparent",
    border: "none",
    color: "#707080",
    fontSize: "12px",
    cursor: "pointer",
  },
  worklogList: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  worklogEntry: {
    display: "flex",
    gap: "8px",
    fontSize: "11px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  worklogTime: {
    color: "#505060",
    minWidth: "70px",
  },
  worklogAgent: {
    color: "#4ecdc4",
    minWidth: "80px",
    fontWeight: "bold",
  },
  worklogAction: {
    color: "#a0a0b0",
    minWidth: "100px",
  },
  worklogNote: {
    color: "#707080",
    flex: 1,
  },
  expandedContainer: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90vw",
    maxWidth: "800px",
    height: "80vh",
    maxHeight: "90vh",
    background: "#0f1520",
    border: "1px solid #2a3a4a",
    borderRadius: "12px",
    padding: "16px",
    zIndex: 2000,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  expandedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  expandedContent: {
    flex: 1,
    background: "#050509",
    borderRadius: "8px",
    padding: "16px",
    overflow: "auto",
  },
  expandedText: {
    margin: 0,
    color: "#c0c0d0",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
};

interface WorkflowResultPanelProps {
  result: any;
  onClose?: () => void;
}

function WorkflowResultPanel({ result, onClose }: WorkflowResultPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showWorklog, setShowWorklog] = useState(false);

  if (!result) return null;

  const statusColors: Record<string, string> = {
    pending: "#feca57",
    in_progress: "#4ecdc4",
    completed: "#26de81",
    failed: "#fc5c65"
  };

  const previewContent = result.artifacts?.[0]?.content || result.response || "";
  const previewLines = previewContent.split("\n").slice(0, 15).join("\n");
  const isTruncated = previewContent.split("\n").length > 15;

  if (expanded) {
    return (
      <div style={workflowResultStyles.expandedContainer} onClick={() => setExpanded(false)}>
        <div style={workflowResultStyles.expandedHeader} onClick={e => e.stopPropagation()}>
          <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
            <span style={{...workflowResultStyles.statusPill, background: statusColors[result.status] || "#4ecdc4"}}>
              {result.status}
            </span>
            <span style={workflowResultStyles.summary}>{result.summary}</span>
          </div>
          <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
            <button style={workflowResultStyles.closeBtn} onClick={() => setExpanded(false)}>−</button>
            {onClose && <button style={workflowResultStyles.closeBtn} onClick={onClose}>×</button>}
          </div>
        </div>
        <div style={workflowResultStyles.expandedContent}>
          <pre style={workflowResultStyles.expandedText}>{previewContent}</pre>
        </div>
      </div>
    );
  }

  return (
    <div style={workflowResultStyles.container}>
      <div style={workflowResultStyles.header}>
        <span style={{...workflowResultStyles.statusPill, background: statusColors[result.status] || "#4ecdc4"}}>
          {result.status}
        </span>
        <span style={workflowResultStyles.summary}>{result.summary}</span>
        {onClose && (
          <button style={workflowResultStyles.closeBtn} onClick={onClose}>×</button>
        )}
      </div>

      <div style={workflowResultStyles.preview}>
        <pre style={workflowResultStyles.previewText}>
          {expanded ? previewContent : previewLines}
          {isTruncated && !expanded && "\n..."}
        </pre>
        {isTruncated && (
          <button style={workflowResultStyles.expandBtn} onClick={() => setExpanded(true)}>
            View full README (expand)
          </button>
        )}
      </div>

      <div style={workflowResultStyles.worklogSection}>
        <button 
          style={workflowResultStyles.worklogToggle} 
          onClick={() => setShowWorklog(!showWorklog)}
        >
          {showWorklog ? "▼" : "▶"} Workflow timeline ({result.worklog?.length || 0} steps)
        </button>
        
        {showWorklog && result.worklog && (
          <div style={workflowResultStyles.worklogList}>
            {result.worklog.map((entry: any, idx: number) => (
              <div key={idx} style={workflowResultStyles.worklogEntry}>
                <span style={workflowResultStyles.worklogTime}>
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span style={workflowResultStyles.worklogAgent}>{entry.agent}</span>
                <span style={workflowResultStyles.worklogAction}>{entry.action}</span>
                <span style={workflowResultStyles.worklogNote}>{entry.note}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatOverlay({ currentTopic, onClose }: { currentTopic: string | null; onClose: () => void }) {
  const [messages, setMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemma-3-1b-it");
  const [ollamaModels, setOllamaModels] = useState<Array<{id: string; name: string}>>([]);
  const [allChatModels, setAllChatModels] = useState<any[]>([]);
  const [showAllChatModels, setShowAllChatModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Onboarding models (cached)
  const onboardingChatRef = useRef<string[]>([]);
  if (onboardingChatRef.current.length === 0) {
    const text = `deepseek-ai/deepseek-v3.1-terminus
moonshotai/kimi-k2-instruct-0905
deepseek-ai/deepseek-v3.2
mistralai/mistral-large-3-675b-instruct-2512
google/gemma-7b
microsoft/phi-3-mini-128k-instruct
upstage/solar-10.7b-instruct`;
    onboardingChatRef.current = text.split('\n').filter(m => m.trim());
  }
  const onboardingChatModels = onboardingChatRef.current;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchOllamaModels().then(setOllamaModels);
    fetch('/api/models/health').then(r => r.json()).then(d => setAllChatModels(d.models || [])).catch(() => {});
  }, []);

  // Get all online models from health endpoint
  const chatOllama = allChatModels.filter((m: any) => m.provider === 'ollama' && m.status === 'online');
  const allNvidiaChat = allChatModels.filter((m: any) => m.provider === 'nvidia' && m.status === 'online');
  const chatNvidia = showAllChatModels 
    ? allNvidiaChat 
    : allNvidiaChat.filter((m: any) => onboardingChatModels.includes(m.id));
  
  const availableModels = [
    ...chatOllama.map((m: any) => ({ id: m.id, name: m.name.split(':')[0] })),
    ...chatNvidia.map((nv: any) => ({ id: nv.id, name: `NVIDIA ${nv.name}` }))
  ];

  const chatToggleStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8b9cb5'
  };

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
          <div>
            <h3 style={chatStyles.title}>Chat with Agents</h3>
            {currentTopic && (
              <div style={{ fontSize: '10px', color: '#feca57', marginTop: '-2px', fontStyle: 'italic' }}>Topic: {currentTopic}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ padding: '4px 8px', background: '#1a2a3a', border: '1px solid #3a4a5a', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer' }}
            >
              {availableModels.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
            <label style={chatToggleStyle}>
              <input type="checkbox" checked={showAllChatModels} onChange={(e) => setShowAllChatModels(e.target.checked)} />
              All {chatNvidia.length}
            </label>
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
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  card: { width: "1140px", maxWidth: "calc(100vw - 40px)", maxHeight: "85vh", background: "rgba(15, 15, 25, 0.98)", borderRadius: "12px", border: "1px solid #2a3a4a", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", resize: "both" },
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
  chatMessages: { height: "400px", overflowY: "auto", background: "#0a1520", borderRadius: "6px", padding: "8px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" },
  chatMessage: { padding: "8px 10px", borderRadius: "6px", fontSize: "12px", lineHeight: 1.4, maxWidth: "85%" },
  chatInput: { flex: 1, padding: "8px 10px", background: "#1a2538", border: "1px solid #2a3548", borderRadius: "4px", color: "#e0e8f0", fontSize: "12px" },
  chatSendBtn: { padding: "8px 16px", background: "#4a90d9", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }
};

const styles: Record<string, React.CSSProperties> = {
  container: { 
    display: "flex", 
    width: "100vw", 
    height: "100vh", 
    background: "#050509", 
    overflow: "hidden", 
    color: "#e8e8f0", 
    fontFamily: "'JetBrains Mono', monospace",
    // App mode optimizations
    WebkitOverflowScrolling: "touch",
    touchAction: "none",
  },
  sidebar: { 
    height: "100%", 
    background: "#0a0a12", 
    borderRight: "1px solid #1b2333", 
    padding: "20px", 
    display: "flex", 
    flexDirection: "column", 
    overflowY: "auto", 
    position: "relative", 
    flexShrink: 0,
    // Better mobile scrolling
    WebkitOverflowScrolling: "touch",
  },
  sidebarCollapsed: { width: "60px", padding: "10px" },
  sidebarMobile: { 
    position: "absolute", 
    left: 0, 
    top: 0, 
    bottom: 0, 
    zIndex: 50, 
    width: "100vw", 
    maxWidth: "100%",
    background: "#0a0a12",
    transform: "translateX(0)", 
    transition: "transform 0.3s ease",
    // Touch-friendly
    WebkitOverflowScrolling: "touch",
  },
  sidebarHidden: { transform: "translateX(-100%)" },
  mainContent: { 
    flex: 1, 
    height: "100%", 
    position: "relative", 
    overflow: "hidden", 
    display: "flex", 
    flexDirection: "row",
    // App mode: full viewport
    width: "100%",
    maxWidth: "100vw",
  },
  mainContentNoSidebar: { marginLeft: 0 },
  canvasWrapper: { 
    height: "100%", 
    position: "relative", 
    flex: 1, 
    minWidth: 0, 
    minHeight: 0,
    // Touch interactions
    touchAction: "none",
  },
  canvas: { 
    width: "100%", 
    height: "100%", 
    display: "block",
    // Prevent touch scrolling on canvas
    touchAction: "none",
  },
  paramsToggle: { 
    width: "100%", 
    padding: "12px", 
    background: "#1a2a2a", 
    border: "1px solid #2a3548", 
    color: "#4ecdc4", 
    borderRadius: "6px", 
    cursor: "pointer", 
    fontSize: "14px", 
    fontWeight: 600, 
    textAlign: "left",
    // Touch-friendly size
    minHeight: "44px",
  },
  resizeHandle: { position: "absolute", right: 0, top: 0, bottom: 0, width: "4px", cursor: "col-resize", background: "transparent", zIndex: 10 },
  subPanel: { background: "#161625", padding: "15px", borderRadius: "8px", border: "1px solid #2a3548", marginTop: "10px" },
  commandLink: { color: "#4ecdc4", textDecoration: "none", fontSize: "12px", padding: "4px 8px", border: "1px solid #2a3548", borderRadius: "4px", background: "#0a0a12" },
  secondaryBtn: { 
    width: "100%", 
    padding: "12px", 
    background: "#2a3548", 
    color: "#fff", 
    border: "none", 
    borderRadius: "6px", 
    marginTop: "8px", 
    cursor: "pointer", 
    fontSize: "14px",
    // Touch-friendly
    minHeight: "44px",
  },
  agentCard: { 
    position: "absolute", 
    bottom: "100px", 
    right: "20px", 
    width: "300px", 
    background: "rgba(15, 15, 25, 0.95)", 
    border: "1px solid #3a3a5a", 
    borderRadius: "12px", 
    padding: "20px", 
    zIndex: 100, 
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)", 
    maxWidth: "calc(100vw - 40px)",
    // Mobile responsive
    maxHeight: "60vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  agentCardMobile: { 
    width: "calc(100vw - 40px)", 
    right: "20px", 
    left: "20px", 
    bottom: "80px",
    maxHeight: "50vh",
  },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", padding: "8px" },
  chatBox: { height: "400px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "4px", padding: "8px", fontSize: "11px", margin: "12px 0", border: "1px solid #2a2a3a" },
  input: { flex: 1, background: "#0a0a15", border: "1px solid #2a2a3a", color: "#fff", padding: "12px", borderRadius: "6px", fontSize: "14px", minHeight: "44px" },
  sendBtn: { background: "#4a90d9", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", minHeight: "44px" },
  moodBtn: { background: "#2a2a3a", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "16px", minHeight: "44px" },
  iconBtn: { background: "none", border: "none", color: "#ff6432", cursor: "pointer", fontSize: "18px", padding: "8px" },
  badge: { padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", color: "#000" },
  modelStatus: { display: 'flex', alignItems: 'center', margin: '8px 0' },
  formGroup: { marginBottom: '12px' }
};

// ConvoViewer Component - displays stored cooler/scrum conversations
function ConvoViewer({ sessions, selectedSession, onSelectSession, type, onChangeType, onClose }: {
  sessions: any[];
  selectedSession: any;
  onSelectSession: (s: any) => void;
  type: "cooler" | "scrum";
  onChangeType: (t: "cooler" | "scrum") => void;
  onClose: () => void;
}) {
  const [expandedUtterances, setExpandedUtterances] = useState<Record<number, boolean>>({});
  
  const toggleUtterance = (idx: number) => {
    setExpandedUtterances(prev => ({ ...prev, [idx]: !prev[idx] }));
  };
  
  const parseUtterances = (session: any) => {
    try {
      if (typeof session.utterances === 'string') {
        return JSON.parse(session.utterances);
      }
      return session.utterances || [];
    } catch {
      return [];
    }
  };
  
  const formatDate = (date: any) => {
    if (!date) return "Unknown";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return String(date);
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: '#0a0a12', zIndex: 1000, overflow: 'auto',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#4ecdc4', margin: 0 }}>💬 Convo Viewer</h2>
          <button onClick={onClose} style={{ background: '#2a2a3a', border: '1px solid #4ecdc4', color: '#4ecdc4', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>✕ Close</button>
        </div>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => onChangeType("cooler")}
            style={{ 
              background: type === 'cooler' ? '#4ecdc4' : '#2a2a3a', 
              color: type === 'cooler' ? '#000' : '#4ecdc4',
              border: '1px solid #4ecdc4', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            Cooler
          </button>
          <button 
            onClick={() => onChangeType("scrum")}
            style={{ 
              background: type === 'scrum' ? '#feca57' : '#2a2a3a', 
              color: type === 'scrum' ? '#000' : '#feca57',
              border: '1px solid #feca57', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            Scrum
          </button>
        </div>
        
        {sessions.length === 0 ? (
          <div style={{ color: '#808090', textAlign: 'center', padding: '40px' }}>
            No {type} sessions found. Run some conversations first!
          </div>
        ) : !selectedSession ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sessions.slice(0, 20).map((session: any, idx: number) => (
              <div 
                key={idx}
                onClick={() => onSelectSession(session)}
                style={{ 
                  background: '#1a1a2a', border: '1px solid #2a2a3a', padding: '12px', borderRadius: '6px', 
                  cursor: 'pointer', transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4ecdc4'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2a3a'}
              >
                <div style={{ fontSize: '12px', color: '#4ecdc4', marginBottom: '4px' }}>{session.topic || "Untitled"}</div>
                <div style={{ fontSize: '10px', color: '#606070' }}>
                  {session.participants?.join?.(", ") || "No participants"} • {formatDate(session.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div>
              <button onClick={() => onSelectSession(null)} style={{ background: '#2a2a3a', border: 'none', color: '#4ecdc4', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>
                ← Back to list
              </button>
              
              <div style={{ background: '#1a1a2a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#808090', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Conversation Topic</div>
                <div style={{ fontSize: '16px', color: '#4ecdc4', marginBottom: '8px', fontWeight: 'bold' }}>{selectedSession.topic || "Untitled"}</div>
                <div style={{ fontSize: '11px', color: '#606070' }}>
                  Type: {selectedSession.session_type} • Created: {formatDate(selectedSession.created_at)} • Updated: {formatDate(selectedSession.updated_at)}
                </div>
              </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {parseUtterances(selectedSession).map((utterance: any, idx: number) => (
                <div 
                  key={idx}
                  style={{ 
                    background: '#1a1a2a', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#feca57', fontWeight: 'bold' }}>{utterance.agentId || "Unknown"}</span>
                    <span style={{ fontSize: '10px', color: '#404050' }}>{formatDate(utterance.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0a0b0', marginTop: '6px' }}>
                    {utterance.text?.length > 100 && !expandedUtterances[idx] 
                      ? utterance.text.slice(0, 100) + "..." 
                      : utterance.text || "(no text)"}
                    {utterance.text?.length > 100 && (
                      <button 
                        onClick={() => toggleUtterance(idx)}
                        style={{ background: 'none', border: 'none', color: '#4ecdc4', cursor: 'pointer', marginLeft: '8px', fontSize: '10px' }}
                      >
                        {expandedUtterances[idx] ? "collapse" : "expand"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
