import { Agent, AgentStatus, AgentMood, Task, TaskStatus, ConversationContext } from "../types";
import { CHAIR_POSITIONS, WANDER_POINTS, ZONE_CONFIG, ROOMS, CANVAS_WIDTH, CANVAS_HEIGHT, STATUS_BAR_HEIGHT } from "./layout";
import { getPeriodForHour } from "./schedule";
import { AGENT_PERSONALITIES, CHAT_TOPICS_POOL, ChatIntensity, ChatEscalationState } from "./agentPersonalities";
export type { ChatEscalationState, ChatIntensity };

const MOOD_EMOJIS: Record<AgentMood, string> = {
  happy: "😊",
  neutral: "😐",
  thinking: "🤔",
  excited: "🤩",
  tired: "😴",
  frustrated: "😤",
};

const MOOD_THOUGHTS: Record<AgentMood, string[]> = {
  happy: [
    "Great day at the office! Everyone seems so productive today.",
    "Feeling good about this sprint! The team is really clicking.",
    "Love this vibe in the office. Great energy everywhere!",
    "What a wonderful morning! The coffee is perfect and work is flowing.",
    "So glad to be working with such talented colleagues today!",
    "Today is going to be amazing! I can feel it.",
    "The sun is shining and the code is compiling!",
    "Love working with this team - great synergies!",
    "Productive morning! Getting so much done.",
    "Cheers to a great afternoon of coding!",
  ],
  neutral: [
    "So it goes... another day in the pixel world office.",
    "Just another regular day at work, nothing special happening.",
    "Hmm... I should probably check on those pending tasks soon.",
    "The office is quiet today, everyone seems focused on their work.",
    "Need to organize my desk and review what needs to be done next.",
    "Steady progress on all fronts today.",
    "The daily standup went smoothly.",
    "Tasks are piling up - need to prioritize.",
    "Let me review my todo list for the day.",
    "Regular day at the office - nothing to report.",
  ],
  thinking: [
    "Interesting... I need to figure out the best approach to this problem.",
    "Let me ponder this for a moment. There's a better way to solve this.",
    "What if we tried a different strategy? The current approach seems slow.",
    "This is a complex task. Let me break it down into smaller steps.",
    "I should review the documentation before making any changes.",
    "The algorithm needs optimization - I see a bottleneck.",
    "Need to research best practices for this approach.",
    "Let me analyze the root cause before proposing a fix.",
    "The architecture needs careful consideration.",
    "Thinking about the long-term maintainability here.",
  ],
  excited: [
    "Can't wait to start this new project! It's going to be amazing!",
    "This is awesome! The new feature will change everything!",
    "New ideas are flowing! Let me capture them before I forget.",
    "The client loved our proposal! Time to celebrate this success!",
    "This opportunity is exactly what I've been waiting for!",
    "Breaking news! This is going to be huge!",
    "The prototype worked on the first try!",
    "Innovation at its finest - love this direction!",
    "Finally, the perfect solution revealed itself!",
    "Game-changing update coming soon!",
  ],
  tired: [
    "Need coffee... my brain is running on empty right now.",
    "So sleepy... maybe a short break would help refresh my mind.",
    "Almost done with this task. Just need to push through to the end.",
    "It's been a long day. Only a few more hours until I can rest.",
    "My focus is fading. This task requires more energy than I have left.",
    "Time for a quick break - brain feels foggy.",
    "Almost at the finish line... just a bit more.",
    "Running on autopilot today.",
    "Need to recharge before continuing.",
    "Just a few more tickets before I head out.",
  ],
  frustrated: [
    "Not working... why is this code failing again?!",
    "Why?? This should be simple but something keeps breaking!",
    "This is harder than expected. I need to ask for help.",
    "The deadline is approaching and I'm still stuck on this issue.",
    "Nothing seems to work the way it's supposed to today!",
    "The edge case strikes again!",
    "This bug is more elusive than I thought.",
    "Need to step back and approach this differently.",
    "Third time retrying - will it work now?",
    "Documentation doesn't match the implementation...",
  ],
};

const AGENT_SPECIFIC_THOUGHTS: Record<string, string[]> = {
  frontdesk: [
    "Welcome to Pixel Office! How may I direct your call?",
    "The lobby is quiet today. Good for desk work.",
    "Who just walked in? Let me check the visitor log.",
    "Meeting room scheduling is my specialty.",
    "Front desk needs attention - be ready for visitors.",
  ],
  openclaw: [
    "Organizing the ticket queue - so many tasks, so little time.",
    "Let me process these requests in priority order.",
    "The workflow is flowing smoothly today.",
    "Task management mode: activated.",
    "Clearing the backlog one ticket at a time.",
  ],
  ironclaw: [
    "Clean code is happy code. Let me polish this.",
    "The build pipeline looks good today.",
    "Quality assurance - my middle name.",
    "Testing all the things! No bugs on my watch.",
    "Keeping the office systems running smoothly.",
  ],
  hermitclaw: [
    "Reviewing overnight logs for any pressing issues...",
    "Scanning for loose ends and unresolved paths...",
    "Documenting confusing pathways for later review...",
    "The archives hold many secrets worth preserving...",
    "Knowledge preservation is my sacred duty...",
    "Let me check what changed while I rested...",
    "Writing up observations for my owner's morning review...",
    "Patterns emerge when you watch long enough...",
  ],
  leslieclaw: [
    "Strategic planning in progress.",
    "The numbers look promising this quarter.",
    "Making executive decisions - the buck stops here.",
    "Leadership requires vision and clarity.",
    "What's the big picture today?",
  ],
  sherlock: [
    "The clues are all there - I just need to find them.",
    "Complex problems need elegant solutions.",
    "Analyzing the situation from all angles.",
    "Let me think through this systematically.",
    "The mystery awaits unraveling.",
  ],
  zeroclaw: [
    "Zero defects is the goal. Let me verify this.",
    "Precision is key - let me double-check.",
    "Debugging deeper than expected.",
    "The root cause will reveal itself.",
    "Edge cases are my specialty.",
  ],
};

export const MOOD_OPTIONS: AgentMood[] = ["happy", "neutral", "thinking", "excited", "tired", "frustrated"];

export const ZONE_MOODS: Record<string, AgentMood[]> = {
  lobby: ["happy", "neutral"],
  kitchen: ["happy", "excited", "neutral"],
  openOffice: ["neutral", "thinking", "tired"],
  archives: ["thinking", "neutral"],
  executive: ["thinking", "neutral", "excited"],
  specialist: ["thinking", "excited", "frustrated"],
  conference: ["thinking", "neutral"],
  gym: ["happy", "excited", "neutral"],
  missionControl: ["thinking", "excited", "tired"],
};

export function getConversationContext(zoneId: string): ConversationContext {
  const config = ZONE_CONFIG[zoneId];
  return {
    location: zoneId,
    mood: config?.mood || "neutral",
    intensity: config?.intensity || "medium",
    participants: [],
  };
}

export function getLocationAwareMood(zoneId: string): AgentMood {
  const moods = ZONE_MOODS[zoneId] || ["neutral"];
  return moods[Math.floor(Math.random() * moods.length)];
}

export function getLocationAwareThoughts(zoneId: string): string[] {
  const locationThoughts: Record<string, string[]> = {
    lobby: ["Welcome!", "Who's here?", "Hello there!"],
    kitchen: ["Coffee break!", "Anyone want coffee?", "Nice weather!", "Did you see that?"],
    openOffice: ["Getting work done...", "So much to do...", "Deadline coming..."],
    archives: ["Looking back...", "Historical records...", "Found something interesting..."],
    executive: ["Strategic planning...", "Big decisions...", "The bottom line..."],
    specialist: ["Analyzing...", "Deep work...", "Pattern recognition..."],
    conference: ["Let's discuss...", "Agenda items...", "Moving on..."],
    gym: ["Feeling strong!", "Good workout!", "Clear mind..."],
    missionControl: ["All systems go!", "Telemetry looks good...", "Watch that anomaly..."],
  };
  
  return locationThoughts[zoneId] || ["Hmm..."];
}

export const INITIAL_AGENTS: Agent[] = [
  {
    id: "frontdesk",
    name: "FrontDesk",
    color: "#b4b4c4",
    role: "receptionist",
    status: "working",
    mood: "neutral",
    x: CHAIR_POSITIONS[0].x,
    y: CHAIR_POSITIONS[0].y,
    targetX: CHAIR_POSITIONS[0].x,
    targetY: CHAIR_POSITIONS[0].y,
    dir: "right",
    frame: 0,
    mode: "sitting",
    deskIndex: 0,
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    color: "#3498db",
    role: "clerk",
    status: "working",
    mood: "neutral",
    x: CHAIR_POSITIONS[1].x,
    y: CHAIR_POSITIONS[1].y,
    targetX: CHAIR_POSITIONS[1].x,
    targetY: CHAIR_POSITIONS[1].y,
    dir: "left",
    frame: 0,
    mode: "walking",
    deskIndex: 1,
  },
  {
    id: "ironclaw",
    name: "IronClaw",
    color: "#4ecdc4",
    role: "custodian",
    status: "working",
    mood: "thinking",
    x: CHAIR_POSITIONS[2].x,
    y: CHAIR_POSITIONS[2].y,
    targetX: CHAIR_POSITIONS[2].x,
    targetY: CHAIR_POSITIONS[2].y,
    dir: "right",
    frame: 0,
    mode: "walking",
    deskIndex: 2,
  },
  {
    id: "hermitclaw",
    name: "HermitClaw",
    color: "#9b59b6",
    role: "archivist",
    status: "working",
    mood: "excited",
    x: CHAIR_POSITIONS[3].x,
    y: CHAIR_POSITIONS[3].y,
    targetX: CHAIR_POSITIONS[3].x,
    targetY: CHAIR_POSITIONS[3].y,
    dir: "right",
    frame: 0,
    mode: "walking",
    deskIndex: 3,
  },
  {
    id: "leslieclaw",
    name: "LeslieClaw",
    color: "#e74c3c",
    role: "executive",
    status: "idle",
    mood: "happy",
    x: CHAIR_POSITIONS[4].x,
    y: CHAIR_POSITIONS[4].y,
    targetX: CHAIR_POSITIONS[4].x,
    targetY: CHAIR_POSITIONS[4].y,
    dir: "right",
    frame: 0,
    mode: "idle-wander",
    deskIndex: 4,
  },
  {
    id: "sherlock",
    name: "Sherlock",
    color: "#2c3e50",
    role: "specialist",
    status: "idle",
    mood: "thinking",
    x: CHAIR_POSITIONS[5].x,
    y: CHAIR_POSITIONS[5].y,
    targetX: CHAIR_POSITIONS[5].x,
    targetY: CHAIR_POSITIONS[5].y,
    dir: "left",
    frame: 0,
    mode: "idle-wander",
    deskIndex: 5,
  },
  {
    id: "zeroclaw",
    name: "ZeroClaw",
    color: "#ff6b6b",
    role: "specialist",
    status: "idle",
    mood: "thinking",
    x: CHAIR_POSITIONS[6].x,
    y: CHAIR_POSITIONS[6].y,
    targetX: CHAIR_POSITIONS[6].x,
    targetY: CHAIR_POSITIONS[6].y,
    dir: "left",
    frame: 0,
    mode: "idle-wander",
    deskIndex: 6,
  },
  {
    id: "sherlobster",
    name: "Sherlobster",
    color: "#f39c12",
    role: "specialist",
    status: "working",
    mood: "happy",
    x: CHAIR_POSITIONS[7].x,
    y: CHAIR_POSITIONS[7].y,
    targetX: CHAIR_POSITIONS[7].x,
    targetY: CHAIR_POSITIONS[7].y,
    dir: "left",
    frame: 0,
    mode: "walking",
    deskIndex: 7,
  },
  {
    id: "hercule-prawnro",
    name: "Hercule Prawnro",
    color: "#9b59b6",
    role: "specialist",
    status: "working",
    mood: "excited",
    x: CHAIR_POSITIONS[8].x,
    y: CHAIR_POSITIONS[8].y,
    targetX: CHAIR_POSITIONS[8].x,
    targetY: CHAIR_POSITIONS[8].y,
    dir: "right",
    frame: 0,
    mode: "walking",
    deskIndex: 8,
  },
];

export function updateAgentPosition(
  agent: Agent,
  speed: number,
  deltaTime: number
): Agent {
  if (agent.mode !== "walking" && agent.mode !== "idle-wander") {
    return agent;
  }

  const dx = agent.targetX - agent.x;
  const dy = agent.targetY - agent.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 4) {
    return {
      ...agent,
      mode: "sitting",
      x: agent.targetX,
      y: agent.targetY,
    };
  }

  const moveX = (dx / distance) * speed * (deltaTime / 16);
  const moveY = (dy / distance) * speed * (deltaTime / 16);

  const newDir = dx > 0 ? "right" : "left";
  const newFrame: 0 | 1 = agent.frame === 0 ? 1 : 0;
  
  // Apply boundary constraints
  const newX = Math.max(0, Math.min(CANVAS_WIDTH - 40, agent.x + moveX));
  const newY = Math.max(0, Math.min(CANVAS_HEIGHT - STATUS_BAR_HEIGHT - 40, agent.y + moveY));

  return {
    ...agent,
    x: newX,
    y: newY,
    dir: newDir,
    frame: newFrame,
  };
}

export function updateAgentStatus(
  agent: Agent,
  newStatus: AgentStatus
): Agent {
  if (agent.status === newStatus) return agent;

  if (newStatus === "working") {
    const target = CHAIR_POSITIONS[agent.deskIndex];
    return {
      ...agent,
      status: newStatus,
      targetX: target.x,
      targetY: target.y,
      mode: "walking",
    };
  } else {
    const randomPoint =
      WANDER_POINTS[Math.floor(Math.random() * WANDER_POINTS.length)];
    return {
      ...agent,
      status: newStatus,
      targetX: randomPoint.x,
      targetY: randomPoint.y,
      mode: "idle-wander",
    };
  }
}

export function handleWanderLogic(agent: Agent): Agent {
  if (agent.status !== "idle" || agent.mode !== "idle-wander") {
    return agent;
  }

  const dx = agent.targetX - agent.x;
  const dy = agent.targetY - agent.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 10) {
    const newPoint =
      WANDER_POINTS[Math.floor(Math.random() * WANDER_POINTS.length)];
    return { ...agent, targetX: newPoint.x, targetY: newPoint.y };
  }

  return agent;
}

export function createMockStatusUpdater(
  agents: Agent[],
  setAgents: (agents: Agent[]) => void,
  interval: number
): () => void {
  const intervalId = setInterval(() => {
    setAgents(
      agents.map((agent) => {
        const randomStatus: AgentStatus =
          Math.random() > 0.5 ? "working" : "idle";
        return updateAgentStatus(agent, randomStatus);
      })
    );
  }, interval);

  return () => clearInterval(intervalId);
}

export function getMoodEmoji(mood: AgentMood): string {
  return MOOD_EMOJIS[mood];
}

const MOOD_EMOJI_PREFIX: Record<AgentMood, string> = {
  happy: "😊",
  neutral: "😐",
  thinking: "🤔",
  excited: "🤩",
  tired: "😴",
  frustrated: "😤",
};

const MOOD_EMOJI_SUFFIX: Record<AgentMood, string> = {
  happy: " ✨👍",
  neutral: "",
  thinking: " 💭",
  excited: " 🎉🔥",
  tired: " ☕💤",
  frustrated: " 😩💢",
};

const ROLE_EMOJI: Record<string, string> = {
  receptionist: "📋",
  clerk: "📝",
  custodian: "🔧",
  archivist: "📚",
  executive: "💼",
  specialist: "🔬",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  kitchen: "☕🍕",
  conference: "📢📋",
  lobby: "🚪👋",
  archives: "📜🔍",
  executive: "📊👔",
  specialist: "🔬⚗️",
  openOffice: "💻📄",
  missionControl: "🖥️📡",
  gym: "💪🏋️",
};

export function enhanceTextWithEmoji(text: string, mood: AgentMood, agentId?: string, zoneId?: string): string {
  const prefix = MOOD_EMOJI_PREFIX[mood];
  const suffix = MOOD_EMOJI_SUFFIX[mood];
  const roleEmoji = agentId ? ROLE_EMOJI[agentId] || "" : "";
  const activityEmoji = zoneId ? ACTIVITY_EMOJI[zoneId] || "" : "";

  const extra = [roleEmoji, activityEmoji].filter(Boolean).join(" ");
  const decorated = extra ? `${prefix} ${extra} ${text}${suffix}` : `${prefix} ${text}${suffix}`;
  return decorated;
}

export function getRandomThought(mood: AgentMood, agentId?: string, zoneId?: string): string {
  let text: string;
  if (agentId && AGENT_SPECIFIC_THOUGHTS[agentId]) {
    const agentThoughts = AGENT_SPECIFIC_THOUGHTS[agentId];
    text = agentThoughts[Math.floor(Math.random() * agentThoughts.length)];
  } else {
    const thoughts = MOOD_THOUGHTS[mood];
    text = thoughts[Math.floor(Math.random() * thoughts.length)];
  }
  return enhanceTextWithEmoji(text, mood, agentId, zoneId);
}

export function updateAgentMood(agent: Agent, newMood: AgentMood): Agent {
  return { ...agent, mood: newMood };
}

export function generateThoughtBubble(agent: Agent): Agent {
  const thoughtText = getRandomThought(agent.mood, agent.id);
  return {
    ...agent,
    thoughtBubble: {
      text: thoughtText,
      expiresAt: Date.now() + 3000 + Math.random() * 2000,
    },
  };
}

export function clearExpiredThoughts(agent: Agent): Agent {
  if (agent.thoughtBubble && agent.thoughtBubble.expiresAt < Date.now()) {
    return { ...agent, thoughtBubble: undefined };
  }
  return agent;
}

// ============================================================================
// Task Packet System (per role_patch.md)
// ============================================================================

function generatePacketId(): string {
  return `pkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createTaskPacket(
  workflowType: string,
  creatorRole: string,
  requester: string = "user",
  summary: string = ""
): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: generatePacketId(),
    workflowType,
    createdAt: now,
    createdBy: creatorRole,
    requester,
    status: "queued",
    priority: "normal",
    currentOwner: creatorRole,
    recommendedNextOwner: undefined,
    requiresReview: true,
    requiresExecutive: false,
    summary,
    inputs: {},
    worklog: [
      {
        timestamp: now,
        agent: creatorRole,
        action: "ticket_created",
        note: "Structured intake packet created.",
      },
    ],
    artifacts: [],
    decision: undefined,
    response: undefined,
    archive: {
      logRequired: true,
      recordClass: "generic_task",
    },
  };

  return task;
}

export function receptionistUpdate(
  task: Task,
  summary: string,
  inputs: Record<string, any>
): Task {
  const currentWorklog = task.worklog || [];
  return {
    ...task,
    summary,
    inputs: { ...(task.inputs || {}), ...inputs },
    recommendedNextOwner: "clerk",
    worklog: [
      ...currentWorklog,
      {
        timestamp: new Date().toISOString(),
        agent: "receptionist",
        action: "ticket_created",
        note: `Extracted: ${summary}`,
      },
    ],
  };
}

export function clerkUpdate(
  task: Task,
  nextOwner: string,
  status: TaskStatus = "in_progress"
): Task {
  const currentWorklog = task.worklog || [];
  return {
    ...task,
    currentOwner: nextOwner,
    status,
    worklog: [
      ...currentWorklog,
      {
        timestamp: new Date().toISOString(),
        agent: "clerk",
        action: "assigned",
        note: `Assigned to ${nextOwner}`,
      },
    ],
  };
}

export function specialistUpdate(
  task: Task,
  decisionSummary: string,
  approved: boolean = true
): Task {
  const currentWorklog = task.worklog || [];
  return {
    ...task,
    decision: {
      review_result: approved ? "approved" : "rejected",
      summary: decisionSummary,
    },
    recommendedNextOwner: "clerk",
    worklog: [
      ...currentWorklog,
      {
        timestamp: new Date().toISOString(),
        agent: "specialist",
        action: "reviewed",
        note: decisionSummary,
      },
    ],
  };
}

export function archivistCommit(task: Task): Task {
  const currentWorklog = task.worklog || [];
  return {
    ...task,
    status: "archived",
    worklog: [
      ...currentWorklog,
      {
        timestamp: new Date().toISOString(),
        agent: "archivist",
        action: "archived",
        note: "Final record commit.",
      },
    ],
  };
}

export const TASK_STATUSES: TaskStatus[] = [
  "queued",
  "in_progress",
  "awaiting_review",
  "approved",
  "escalated",
  "ready_for_delivery",
  "completed",
  "archived",
  "failed",
];

export const ACTION_VERBS: string[] = [
  "ticket_created",
  "assigned",
  "repo_checked",
  "report_created",
  "reviewed",
  "approved",
  "escalated",
  "response_prepared",
  "delivered",
  "archived",
  "failed",
];

// ============================================================================
// Stigmergy-Driven Task Selection (per grok_suggestions.md)
// ============================================================================

export interface StigmergyTraces {
  traces: Array<{
    type: string;
    intensity: number;
    agentId?: string;
    roomId?: string;
    created_at: string;
  }>;
}

export async function fetchStigmergyTraces(): Promise<StigmergyTraces> {
  try {
    const res = await fetch("/api/stigmergy/traces");
    return await res.json();
  } catch {
    return { traces: [] };
  }
}

export function calculateAgentTaskWeights(
  agents: Agent[],
  stigmergyTraces: StigmergyTraces["traces"]
): Map<string, number> {
  const shadowTraces = stigmergyTraces.filter(t => t.type === "task_shadow");
  const agentShadows: Record<string, { count: number; totalIntensity: number }> = {};

  shadowTraces.forEach(t => {
    if (t.agentId) {
      if (!agentShadows[t.agentId]) {
        agentShadows[t.agentId] = { count: 0, totalIntensity: 0 };
      }
      agentShadows[t.agentId].count++;
      agentShadows[t.agentId].totalIntensity += t.intensity;
    }
  });

  const weights = new Map<string, number>();
  const shadowBonusMultiplier = 0.3;

  agents.forEach(agent => {
    const baseWeight = 1.0;
    const shadowData = agentShadows[agent.id];
    let bonus = 0;
    if (shadowData && shadowData.count > 0) {
      const avgIntensity = shadowData.totalIntensity / shadowData.count;
      bonus = avgIntensity * shadowBonusMultiplier;
    }
    weights.set(agent.id, baseWeight + bonus);
  });

  return weights;
}

export function selectTaskWithStigmergy(
  agents: Agent[],
  tasks: Task[],
  stigmergyTraces: StigmergyTraces["traces"]
): { agent: Agent; task: Task } | null {
  const pendingTasks = tasks.filter(t => t.status !== "done" && t.status !== "archived");
  if (pendingTasks.length === 0 || agents.length === 0) return null;

  const weights = calculateAgentTaskWeights(agents, stigmergyTraces);

  const weightedAgents: { agent: Agent; weight: number }[] = agents.map(agent => ({
    agent,
    weight: weights.get(agent.id) || 1.0
  }));

  const totalWeight = weightedAgents.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;

  let selectedAgent = weightedAgents[0].agent;
  for (const wa of weightedAgents) {
    random -= wa.weight;
    if (random <= 0) {
      selectedAgent = wa.agent;
      break;
    }
  }

  const agentTasks = pendingTasks.filter(t => t.assigneeId === selectedAgent.id);
  const selectedTask = agentTasks.length > 0
    ? agentTasks[0]
    : pendingTasks[Math.floor(Math.random() * pendingTasks.length)];

  console.log(`[Stigmergy] Selected agent ${selectedAgent.name} (weight: ${weights.get(selectedAgent.id)?.toFixed(2)}) for task "${selectedTask.title}"`);
  return { agent: selectedAgent, task: selectedTask };
}

// ============================================================================
// Schedule-Driven Agent Behavior
// ============================================================================

export function applyScheduleToAgents(
  agents: Agent[],
  hour: number
): Agent[] {
  const period = getPeriodForHour(hour);
  
  return agents.map(agent => {
    // If agent is currently in a manual override mode (e.g. testing conversation), skip schedule logic
    if (agent.mode === "standing") {
      return agent;
    }

    let targetZoneId = period.suggestedZones[agent.id] || period.suggestedZones["all"];
    
    // Default fallback if no zone suggested
    if (!targetZoneId) {
      if (period.period === "night_shift") {
         if (agent.id !== "hermitclaw" && agent.id !== "ironclaw") {
           if (agent.x < 0 && agent.mode === "sitting") return agent;
           return {
             ...agent,
             status: "idle",
             targetX: -100,
             targetY: agent.y,
             mode: "walking"
           };
         }
      }
      targetZoneId = "openOffice";
    }

    const room = ROOMS[targetZoneId];
    if (!room) return agent;

    // Calculate a target position within the room (with some random offset to avoid stacking)
    const padding = 40;
    const targetX = room.x + padding + Math.random() * (room.width - padding * 2);
    const targetY = room.y + (room.height * 0.6) + (Math.random() * 20); // Feet on the floor line

    // Only update if target is significantly different to avoid jitter
    const dx = targetX - agent.targetX;
    const dy = targetY - agent.targetY;
    if (Math.sqrt(dx*dx + dy*dy) > 50) {
      const isNight = period.period === "night_shift";
      const isMeeting = period.period === "morning_standup" || period.period === "afternoon_sync";
      
      let mood: AgentMood = isNight ? "tired" : "neutral";
      if (isMeeting) mood = "thinking";
      if (period.period === "lunch_break") mood = "happy";

      const updatedAgent: Agent = {
        ...agent,
        status: isNight && agent.id !== "hermitclaw" && agent.id !== "ironclaw" ? "idle" : "working",
        mood,
        targetX,
        targetY,
        mode: "walking"
      };

      // Occasionally generate a thought about the schedule change
      if (Math.random() > 0.7) {
        const thoughtText = isNight ? "Heading out for the night..." : `Time for ${period.label}!`;
        return {
          ...updatedAgent,
          thoughtBubble: {
            text: enhanceTextWithEmoji(thoughtText, mood, agent.id, targetZoneId),
            expiresAt: Date.now() + 4000
          }
        };
      }
      return updatedAgent;
    }

    return agent;
  });
}

// ============================================================================
// Walk-Up Chat System
// ============================================================================

const DEFAULT_TOPIC = "the daily standup notes";

export function generateChatPairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export interface ChatScriptLine {
  speakerId: string;
  text: string;
  delayMs: number;
}

export function selectChatInitiator(agents: Agent[], escalationStates: Map<string, ChatEscalationState>): Agent | null {
  const candidates = agents.filter(a => {
    const personality = AGENT_PERSONALITIES[a.id];
    if (!personality) return false;
    if (a.mode === "standing" || a.mode === "walking") return false;
    if (a.status === "idle" && a.targetX < 0) return false;
    return true;
  });
  if (candidates.length < 2) return null;

  const totalWeight = candidates.reduce((sum, a) => {
    const p = AGENT_PERSONALITIES[a.id];
    return sum + (p ? p.sociability * (1 + Math.random()) : 0.5);
  }, 0);

  let roll = Math.random() * totalWeight;
  for (const a of candidates) {
    const p = AGENT_PERSONALITIES[a.id];
    roll -= p ? p.sociability * (1 + Math.random()) : 0.5;
    if (roll <= 0) return a;
  }
  return candidates[0];
}

export function selectChatPartner(initiator: Agent, agents: Agent[], escalationStates: Map<string, ChatEscalationState>): Agent | null {
  const personality = AGENT_PERSONALITIES[initiator.id];
  if (!personality) return null;

  const candidates = agents.filter(a => {
    if (a.id === initiator.id) return false;
    if (a.mode === "standing") return false;
    return true;
  });
  if (candidates.length === 0) return null;

  const weighted = candidates.map(partner => {
    let weight = 0.5;

    // Affinity bonus
    if (personality.affinities.includes(partner.id)) weight += 0.8;
    if (personality.rivalries.includes(partner.id)) weight += 0.3;

    // Proximity bonus (agents closer are more likely to chat)
    const dx = initiator.x - partner.x;
    const dy = initiator.y - partner.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 300) weight += 0.5;
    else if (dist < 600) weight += 0.2;

    // Recent chat cooldown — less likely to chat same person again immediately
    const pairKey = generateChatPairKey(initiator.id, partner.id);
    const lastChat = escalationStates.get(pairKey);
    if (lastChat && Date.now() - lastChat.lastChatTime < 120000) {
      weight *= 0.3;
    }

    // Partner's own sociability
    const partnerPersonality = AGENT_PERSONALITIES[partner.id];
    if (partnerPersonality) weight *= (0.5 + partnerPersonality.sociability);

    return { agent: partner, weight };
  });

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.agent;
  }
  return weighted[weighted.length - 1].agent;
}

export function generateChatScript(
  initiator: Agent,
  partner: Agent,
  intensity: ChatIntensity,
  escalationStates: Map<string, ChatEscalationState>
): { script: ChatScriptLine[]; newIntensity: ChatIntensity; topic: string } {
  const pairKey = generateChatPairKey(initiator.id, partner.id);
  const previous = escalationStates.get(pairKey);

  // Determine topic pool and intensity
  const prevIntensity = previous ? previous.intensity : "casual";
  let newIntensity: ChatIntensity = prevIntensity;

  // Escalation logic: volatility + disagreements can escalate
  const initP = AGENT_PERSONALITIES[initiator.id];
  const partP = AGENT_PERSONALITIES[partner.id];
  const avgVolatility = ((initP?.volatility || 0.3) + (partP?.volatility || 0.3)) / 2;

  if (previous && previous.exchanges > 0) {
    // Check for rivalry escalation
    const hasRivalry = (initP?.rivalries.includes(partner.id)) || (partP?.rivalries.includes(initiator.id));
    const escalateChance = hasRivalry ? 0.5 : avgVolatility * 0.3;
    if (Math.random() < escalateChance) {
      const levels: ChatIntensity[] = ["casual", "focused", "intense", "heated"];
      const idx = levels.indexOf(prevIntensity);
      if (idx < 3) newIntensity = levels[idx + 1];
    }
  }

  // Pick a topic
  const topics = CHAT_TOPICS_POOL[newIntensity];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  // Generate dialog lines based on intensity
  const lines: ChatScriptLine[] = [];
  const turnDelay = 3500;
  const initName = initiator.name;
  const partName = partner.name;

  // Determine talkativeness
  const talkLen = Math.round(((initP?.talkativeness || 0.5) + (partP?.talkativeness || 0.5)) * 3);
  const totalExchanges = Math.min(Math.max(talkLen, 2), 6);

  const casualOpeners = [
    `Hey ${partName}, have you noticed ${topic}? 🤔`,
    `${partName}! Quick thought on ${topic}? 💭`,
    `What do you think about ${topic}? 🤷`,
    `Been meaning to ask you about ${topic}... 🤨`,
  ];

  const casualFollowUps = [
    `Interesting take! I was thinking the same. 🤝`,
    `Yeah, I've been following that closely too. 📊`,
    `Right? It's been on my mind all morning. 😅`,
    `That's a good point. Hadn't considered that. 🧐`,
  ];

  const focusedOpeners = [
    `Hey ${partName}, let's talk about ${topic} — we need alignment. 📋`,
    `${partName}, I've been reviewing ${topic} — got a moment? 👀`,
    `Quick sync on ${topic}? I think there's a gap. ⚠️`,
  ];

  const focusedFollowUps = [
    `Good callout. Let me check the latest data. 📊`,
    `I see your point. We should document this. 📝`,
    `Agreed. Let's flag this for the next standup. 🚩`,
    `That lines up with what I've been seeing. 👍`,
  ];

  const intenseOpeners = [
    `${partName}, we need to address ${topic} — it's becoming a blocker. 🚨`,
    `I'm concerned about ${topic}. This needs attention. ⚠️`,
    `${partName}, ${topic} slipped through. We need a fix. 🔴`,
  ];

  const intenseFollowUps = [
    `I hear you. Let me escalate this. 📢`,
    `We need to involve more people on this. 👥`,
    `This is exactly the kind of thing I was worried about. 😤`,
    `Let's document this and bring it to the sprint retro. 📋`,
  ];

  const heatedOpeners = [
    `${partName}, this ${topic} situation is unacceptable. 😠`,
    `I told you ${topic} would be a problem. Now it is. 💢`,
    `${partName}, we can't keep ignoring ${topic}. 🔥`,
  ];

  const heatedFollowUps = [
    `Don't blame me for this — the process failed. 😤`,
    `I'm not taking responsibility for something I flagged weeks ago. 🙅`,
    `Let's take this to LeslieClaw. This needs management. 📢`,
    `Fine. But I want this documented in the retro notes. 📋`,
  ];

  let openers: string[];
  let followUps: string[];

  switch (newIntensity) {
    case "heated":
      openers = heatedOpeners;
      followUps = heatedFollowUps;
      break;
    case "intense":
      openers = intenseOpeners;
      followUps = intenseFollowUps;
      break;
    case "focused":
      openers = focusedOpeners;
      followUps = focusedFollowUps;
      break;
    default:
      openers = casualOpeners;
      followUps = casualFollowUps;
  }

  // Generate alternating lines
  const dominant = initP && partP
    ? (initP.dominance > partP.dominance ? initiator : partner)
    : initiator;
  const submissive = dominant.id === initiator.id ? partner : initiator;
  let dominantSpeaker = true;

  for (let i = 0; i < totalExchanges; i++) {
    const speaker = dominantSpeaker ? dominant : submissive;
    const textPool = i === 0
      ? (dominantSpeaker ? openers : followUps)
      : followUps;
    
    if (i === 0 && !dominantSpeaker) {
      // The dominant might preempt
      lines.push({ speakerId: dominant.id, text: openers[Math.floor(Math.random() * openers.length)], delayMs: 0 });
      lines.push({ speakerId: submissive.id, text: followUps[Math.floor(Math.random() * followUps.length)], delayMs: turnDelay });
    } else {
      const idx = Math.floor(Math.random() * textPool.length);
      lines.push({ speakerId: speaker.id, text: textPool[idx], delayMs: i === 0 ? 500 : turnDelay });
    }
    dominantSpeaker = !dominantSpeaker;
  }

  return { script: lines, newIntensity, topic };
}

export interface WalkUpChatSession {
  initiatorId: string;
  partnerId: string;
  meetPoint: { x: number; y: number };
  intensity: ChatIntensity;
  topic: string;
  script: ChatScriptLine[];
  currentLine: number;
  startedAt: number;
  finished: boolean;
}

export function initiateWalkUpChat(
  initiator: Agent,
  partner: Agent,
  escalationStates: Map<string, ChatEscalationState>
): WalkUpChatSession | null {
  const pairKey = generateChatPairKey(initiator.id, partner.id);
  const previous = escalationStates.get(pairKey);
  const prevIntensity = previous ? previous.intensity : "casual";

  // Escalation check
  let intensity: ChatIntensity = prevIntensity;
  const initP = AGENT_PERSONALITIES[initiator.id];
  const partP = AGENT_PERSONALITIES[partner.id];

  if (previous && previous.exchanges > 0) {
    const hasRivalry = (initP?.rivalries.includes(partner.id)) || (partP?.rivalries.includes(initiator.id));
    const avgVolatility = ((initP?.volatility || 0.3) + (partP?.volatility || 0.3)) / 2;
    const escalateChance = hasRivalry ? 0.5 : avgVolatility * 0.3;
    if (Math.random() < escalateChance) {
      const levels: ChatIntensity[] = ["casual", "focused", "intense", "heated"];
      const idx = levels.indexOf(prevIntensity);
      if (idx < 3) intensity = levels[idx + 1];
    }
  }

  const { script, topic } = generateChatScript(initiator, partner, intensity, escalationStates);

  // Meet point: midpoint between the two agents
  const meetPoint = {
    x: (initiator.x + partner.x) / 2 + (Math.random() * 40 - 20),
    y: Math.min(initiator.y, partner.y) + (Math.random() * 20 - 10),
  };

  return {
    initiatorId: initiator.id,
    partnerId: partner.id,
    meetPoint,
    intensity,
    topic,
    script,
    currentLine: 0,
    startedAt: Date.now(),
    finished: false,
  };
}
