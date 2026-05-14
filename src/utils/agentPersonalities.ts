export interface AgentPersonality {
  agentId: string;
  name: string;
  sociability: number;   // 0-1: how often they initiate chats
  talkativeness: number; // 0-1: how many lines they speak per chat
  curiosity: number;     // 0-1: interest in diverse topics
  dominance: number;     // 0-1: tends to lead/control conversation
  volatility: number;    // 0-1: mood swings, escalation proneness
  affinities: string[];  // agent IDs they're naturally drawn to
  rivalries: string[];   // agent IDs they tend to clash with
}

export const AGENT_PERSONALITIES: Record<string, AgentPersonality> = {
  frontdesk: {
    agentId: "frontdesk",
    name: "FrontDesk",
    sociability: 0.9,
    talkativeness: 0.6,
    curiosity: 0.4,
    dominance: 0.2,
    volatility: 0.1,
    affinities: ["openclaw", "ironclaw"],
    rivalries: [],
  },
  openclaw: {
    agentId: "openclaw",
    name: "OpenClaw",
    sociability: 0.7,
    talkativeness: 0.5,
    curiosity: 0.6,
    dominance: 0.3,
    volatility: 0.2,
    affinities: ["frontdesk", "ironclaw", "zeroclaw"],
    rivalries: [],
  },
  ironclaw: {
    agentId: "ironclaw",
    name: "IronClaw",
    sociability: 0.5,
    talkativeness: 0.4,
    curiosity: 0.5,
    dominance: 0.4,
    volatility: 0.3,
    affinities: ["zeroclaw", "hermitclaw"],
    rivalries: ["sherlock"],
  },
  hermitclaw: {
    agentId: "hermitclaw",
    name: "HermitClaw",
    sociability: 0.3,
    talkativeness: 0.7,
    curiosity: 0.9,
    dominance: 0.1,
    volatility: 0.2,
    affinities: ["ironclaw", "sherlock"],
    rivalries: [],
  },
  leslieclaw: {
    agentId: "leslieclaw",
    name: "LeslieClaw",
    sociability: 0.8,
    talkativeness: 0.6,
    curiosity: 0.5,
    dominance: 0.9,
    volatility: 0.4,
    affinities: ["ironclaw", "frontdesk"],
    rivalries: [],
  },
  sherlock: {
    agentId: "sherlock",
    name: "Sherlock",
    sociability: 0.3,
    talkativeness: 0.8,
    curiosity: 0.95,
    dominance: 0.5,
    volatility: 0.5,
    affinities: ["zeroclaw"],
    rivalries: ["ironclaw"],
  },
  zeroclaw: {
    agentId: "zeroclaw",
    name: "ZeroClaw",
    sociability: 0.4,
    talkativeness: 0.5,
    curiosity: 0.7,
    dominance: 0.3,
    volatility: 0.6,
    affinities: ["sherlock", "ironclaw"],
    rivalries: [],
  },
  sherlobster: {
    agentId: "sherlobster",
    name: "Sherlobster",
    sociability: 0.6,
    talkativeness: 0.4,
    curiosity: 0.6,
    dominance: 0.2,
    volatility: 0.1,
    affinities: ["openclaw", "frontdesk"],
    rivalries: [],
  },
  "hercule-prawnro": {
    agentId: "hercule-prawnro",
    name: "Hercule Prawnro",
    sociability: 0.7,
    talkativeness: 0.5,
    curiosity: 0.5,
    dominance: 0.6,
    volatility: 0.3,
    affinities: ["sherlock", "zeroclaw"],
    rivalries: [],
  },
};

export type ChatIntensity = "casual" | "focused" | "intense" | "heated";

export interface ChatEscalationState {
  pairId: string;        // "agentA-agentB" (sorted alphabetically)
  intensity: ChatIntensity;
  topic: string;
  exchanges: number;
  lastChatTime: number;
}

export const CHAT_TOPICS_POOL: Record<ChatIntensity, string[]> = {
  casual: [
    "the weather outside", "today's coffee", "weekend plans",
    "the new office plant", "parking situation", "lunch spots nearby",
    "the printer acting up", "the office music playlist",
  ],
  focused: [
    "the sprint deadline", "the latest PR review", "deployment pipeline",
    "code refactoring backlog", "test coverage gaps", "API documentation",
    "the database migration plan", "monitoring alerts",
  ],
  intense: [
    "the production incident", "architectural trade-offs", "tech debt strategy",
    "security vulnerability report", "performance regression",
    "team velocity drop", "cross-team dependency conflict",
  ],
  heated: [
    "coding standards violation", "missed SLA targets", "blame for the outage",
    "responsibility dispute", "architectural disagreement",
    "priority misalignment with leadership",
  ],
};
