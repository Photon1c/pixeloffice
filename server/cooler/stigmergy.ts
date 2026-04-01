import fs from "fs";
import path from "path";

export type TraceType = "review_heat" | "task_shadow" | "social_potential";

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

const TRACES_FILE = "/home/sherlockhums/apps/pixelworld/pixel_office/data/stigmergy_traces.json";
const DEFAULTS = {
  review_heat: { decayMs: 15 * 60 * 1000 },
  task_shadow: { decayMs: 10 * 60 * 1000 },
  social_potential: { decayMs: 5 * 60 * 1000 },
};

function ensureDataDir() {
  const dir = path.dirname(TRACES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getActiveTraces(): StigmergyTrace[] {
  console.log("[Stigmergy] getActiveTraces called, file:", TRACES_FILE);
  if (!fs.existsSync(TRACES_FILE)) {
    console.log("[Stigmergy] File does not exist");
    return [];
  }
  try {
    const raw = fs.readFileSync(TRACES_FILE, "utf-8");
    console.log("[Stigmergy] Raw content:", raw.substring(0, 200));
    if (!raw || raw.trim() === "" || raw.trim() === "null") return [];
    const all: StigmergyTrace[] = JSON.parse(raw);
    const now = new Date().toISOString();
    const active = all.filter(t => t.expires_at > now);
    console.log("[Stigmergy] Active traces:", active.length);
    return active;
  } catch (e) {
    console.log("[Stigmergy] Error:", e);
    return [];
  }
}

export function saveTraces(traces: StigmergyTrace[]) {
  ensureDataDir();
  const data = Array.isArray(traces) ? JSON.stringify(traces, null, 2) : "[]";
  fs.writeFileSync(TRACES_FILE, data);
}

export function depositTrace(trace: Partial<StigmergyTrace>) {
  if (!trace.type) return null;
  
  const now = new Date();
  const decay = DEFAULTS[trace.type].decayMs;
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
  active.push(newTrace);
  saveTraces(active);
  return newTrace;
}

export function getTracesForRoom(roomId: string): StigmergyTrace[] {
  return getActiveTraces().filter(t => t.roomId === roomId);
}
