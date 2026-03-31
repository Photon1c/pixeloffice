import fs from "fs";
import path from "path";

export interface ReviewHeat {
  id: string;
  trace_type: "review_heat";
  source_session_id: string;
  intensity: number; // [0, 1]
  topic: string;
  target_ref?: {
    repo?: string;
    pr?: string;
    issue?: string;
  };
  anchor: string; // e.g. "kitchen", "water_cooler"
  created_at: string;
  expires_at: string;
}

const HEAT_FILE = path.resolve(process.cwd(), "data/review_heat.json");
const DECAY_TIME_MS = 10 * 60 * 1000; // 10 minutes for prototype

export function ensureDataDir() {
  const dir = path.dirname(HEAT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getActiveHeat(): ReviewHeat[] {
  if (!fs.existsSync(HEAT_FILE)) return [];
  try {
    const raw = fs.readFileSync(HEAT_FILE, "utf-8");
    const all: ReviewHeat[] = JSON.parse(raw);
    const now = new Date().toISOString();
    return all.filter(h => h.expires_at > now);
  } catch (e) {
    console.error("[ReviewHeat] Error reading heat file:", e);
    return [];
  }
}

export function saveHeat(heat: ReviewHeat[]) {
  ensureDataDir();
  fs.writeFileSync(HEAT_FILE, JSON.stringify(heat, null, 2));
}

export function depositReviewHeat(sessionId: string, topic: string, content: string, anchor: string = "kitchen") {
  const keywords = ["review", "pr", "pull request", "backlog", "blocked", "approval", "stale", "merge", "bottleneck"];
  const contentLower = content.toLowerCase();
  
  let hitCount = 0;
  keywords.forEach(k => {
    if (contentLower.includes(k)) hitCount++;
  });

  if (hitCount === 0) return null;

  const intensity = Math.min(1, hitCount * 0.2);
  const now = new Date();
  const expires = new Date(now.getTime() + DECAY_TIME_MS);

  const newTrace: ReviewHeat = {
    id: `heat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trace_type: "review_heat",
    source_session_id: sessionId,
    intensity,
    topic,
    anchor,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };

  const active = getActiveHeat();
  active.push(newTrace);
  saveHeat(active);

  console.log(`[ReviewHeat] Deposited heat for session ${sessionId}: intensity ${intensity.toFixed(2)}, topic: ${topic}`);
  return newTrace;
}

export function getTotalHeatIntensity(): number {
  const active = getActiveHeat();
  if (active.length === 0) return 0;
  const total = active.reduce((sum, h) => sum + h.intensity, 0);
  return Math.min(1, total);
}
