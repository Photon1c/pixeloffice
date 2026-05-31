import * as fs from "fs";
import * as path from "path";

export type TraceType = "review_heat" | "task_shadow" | "social_potential";

export interface SocialPotentialResult {
  sessionCount: number;
  participantCount: number;
  intensity: number;
  recentSessions: Array<{id: string; topic: string; participants: string[]; created_at: string}>;
}

export interface StigmergyTrace {
  id: string;
  type: TraceType;
  intensity: number; // [0, 1]
  topic?: string;
  agentId?: string;
  x?: number; // world x
  y?: number; // world y
  roomId?: string;
  created_at: string;
  expires_at: string;
  metadata?: Record<string, any>;
}

const TRACES_FILE = path.resolve(process.cwd(), "data/stigmergy_traces.json");

export function calculateSocialPotential(): SocialPotentialResult {
  const sessionsDir = path.resolve(process.cwd(), "data/cooler_sessions");
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();
  const windowStart = new Date(now - windowMs).toISOString();
  
  let sessionCount = 0;
  let participantCount = 0;
  const recentSessions: SocialPotentialResult["recentSessions"] = [];
  
  try {
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const filePath = path.join(sessionsDir, file);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const session = JSON.parse(raw);
          const stats = fs.statSync(filePath);
          
          let sessionTime = session.created_at || session.startedAt;
          const mtimeMs = stats.mtimeMs;
          
          // Count if session timestamp OR file modification is within window
          const isRecent = sessionTime > windowStart || mtimeMs > now - windowMs;
          
          if (isRecent) {
            sessionCount++;
            const participants = session.participants || [];
            participantCount += participants.length;
            recentSessions.push({
              id: session.id,
              topic: session.topic || '',
              participants,
              created_at: sessionTime || stats.mtime.toISOString()
            });
          }
        } catch (e) {
          console.log("[Stigmergy] Error reading session:", e);
        }
      }
    }
  } catch (e) {
    console.log("[Stigmergy] Error calculating social potential:", e);
  }
  
  console.log("[Stigmergy] Social potential:", { sessionCount, participantCount });
  
  const maxSessions = 10;
  const maxParticipants = 160;
  const sessionNorm = Math.min(sessionCount / maxSessions, 1);
  const participantNorm = Math.min(participantCount / maxParticipants, 1);
  const intensity = (sessionNorm * 0.6) + (participantNorm * 0.4);
  
  return { sessionCount, participantCount, intensity, recentSessions };
}

// Get agent selection weights based on task shadow intensity
export function getAgentWeightsWithShadows(agentIds: string[]): Map<string, number> {
  const traces = getActiveTraces();
  const shadowTraces = traces.filter(t => t.type === 'task_shadow');
  
  // Group by agent
  const agentShadows: Record<string, { count: number; totalIntensity: number }> = {};
  shadowTraces.forEach(t => {
    if (t.agentId) {
      if (!agentShadows[t.agentId]) agentShadows[t.agentId] = { count: 0, totalIntensity: 0 };
      agentShadows[t.agentId].count++;
      agentShadows[t.agentId].totalIntensity += t.intensity;
    }
  });
  
  // Calculate weights: base weight + shadow bonus
  const weights = new Map<string, number>();
  const shadowBonusMultiplier = 0.3; // up to 30% bonus for high shadows
  
  agentIds.forEach(agentId => {
    const baseWeight = 1.0;
    const shadowData = agentShadows[agentId];
    let bonus = 0;
    if (shadowData && shadowData.count > 0) {
      const avgIntensity = shadowData.totalIntensity / shadowData.count;
      bonus = avgIntensity * shadowBonusMultiplier;
      console.log(`[Stigmergy] Agent ${agentId} shadow bonus: ${bonus.toFixed(3)} (${shadowData.count} shadows, avg ${avgIntensity.toFixed(2)})`);
    }
    weights.set(agentId, baseWeight + bonus);
  });
  
  return weights;
}
const DEFAULTS: Record<string, { decayMs: number }> = {
  review_heat: { decayMs: 15 * 60 * 1000 },
  task_shadow: { decayMs: 10 * 60 * 1000 },
  social_potential: { decayMs: 5 * 60 * 1000 },
  loop_heat: { decayMs: 8 * 60 * 1000 },
  observer_attention: { decayMs: 10 * 60 * 1000 },
  speech_activity: { decayMs: 5 * 60 * 1000 },
};

const DEFAULT_DECAY_MS = 5 * 60 * 1000;

function ensureDataDir() {
  const dir = path.dirname(TRACES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getActiveTraces(): StigmergyTrace[] {
  if (!fs.existsSync(TRACES_FILE)) return [];
  try {
    const raw = fs.readFileSync(TRACES_FILE, "utf-8");
    if (!raw || raw.trim() === "" || raw.trim() === "null") return [];
    const all: StigmergyTrace[] = JSON.parse(raw);
    const now = new Date().toISOString();
    return all.filter(t => t.expires_at > now);
  } catch (e) {
    return [];
  }
}

export function saveTraces(traces: StigmergyTrace[]) {
  ensureDataDir();
  const data = Array.isArray(traces) ? JSON.stringify(traces, null, 2) : "[]";
  fs.writeFileSync(TRACES_FILE, data);
}

export interface DepositResult {
  success: boolean;
  trace?: StigmergyTrace;
  skipped?: boolean;
  reason?: string;
}

export function depositTrace(trace: Partial<StigmergyTrace>): DepositResult {
  if (!trace.type) return { success: false, reason: "Missing type" };
  
  const now = new Date();
  const decayConfig = DEFAULTS[trace.type] || { decayMs: DEFAULT_DECAY_MS };
  const decay = decayConfig.decayMs;
  const expires = new Date(now.getTime() + (trace.metadata?.ttl || decay));

  const newTrace: StigmergyTrace = {
    id: `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: trace.type,
    intensity: trace.intensity || 0.5,
    topic: trace.topic,
    agentId: trace.agentId,
    x: trace.x,
    y: trace.y,
    roomId: trace.roomId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    metadata: trace.metadata,
  };

  const active = getActiveTraces();
  // Deduplication: remove old traces of same type+agentId for task_shadow
  // (replaces rather than accumulates, since agent can only have one active shadow)
  // For other types, prevent duplicates within cooldown period.
  const filtered = trace.agentId && trace.type === "task_shadow"
    ? active.filter(t => !(t.type === trace.type && t.agentId === trace.agentId))
    : active;

  filtered.push(newTrace);
  saveTraces(filtered);
  return { success: true, trace: newTrace };
}

export function getTracesForRoom(roomId: string): StigmergyTrace[] {
  return getActiveTraces().filter(t => t.roomId === roomId);
}
