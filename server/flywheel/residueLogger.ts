import * as fs from "fs";
import * as path from "path";
import { 
  ConversationResidue, 
  TaskResidue, 
  DelegationResidue, 
  SpatialResidue, 
  OutcomeResidue,
  OfficeResidue
} from "./residueTypes";
// Imported for potential future use
// import { getActiveHeat } from "../cooler/reviewHeat";
// import { getActiveTraces } from "../cooler/stigmergy";

// Residue storage files
const RESIDUES_FILE = path.resolve(process.cwd(), "data/office_residues.json");
const DECAY_TIMES = {
  conversation_residue: 60 * 60 * 1000, // 1 hour
  task_residue: 24 * 60 * 60 * 1000,    // 24 hours
  delegation_residue: 60 * 60 * 1000,   // 1 hour
  spatial_residue: 30 * 60 * 1000,      // 30 minutes
  outcome_residue: 24 * 60 * 60 * 1000  // 24 hours
};

// Ensure data directory exists
export function ensureDataDir() {
  const dir = path.dirname(RESIDUES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Get all active residues (not expired)
export function getActiveResidues(): OfficeResidue[] {
  if (!fs.existsSync(RESIDUES_FILE)) return [];
  
  try {
    const raw = fs.readFileSync(RESIDUES_FILE, "utf-8");
    const all: OfficeResidue[] = JSON.parse(raw);
    const now = new Date().toISOString();
    return all.filter(r => {
      // Only check expires_at if the property exists (not all residue types have it)
      return !('expires_at' in r) || (r as any).expires_at > now;
    });
  } catch (e) {
    console.error("[ResidueLogger] Error reading residues:", e);
    return [];
  }
}

// Save residues to file
export function saveResidues(residues: OfficeResidue[]) {
  ensureDataDir();
  fs.writeFileSync(RESIDUES_FILE, JSON.stringify(residues, null, 2));
}

// Deposit conversation residue from cooler session
export function depositConversationResidue(
  sessionId: string, 
  topic: string, 
  participants: string[],
  location: string,
  content: string
): ConversationResidue {
  // Calculate signals based on content analysis
  const signals = calculateConversationSignals(content);
  
  const now = new Date();
  const expires = new Date(now.getTime() + DECAY_TIMES.conversation_residue);
  
  const residue: ConversationResidue = {
    id: `conv-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trace_type: "conversation_residue",
    source_session_id: sessionId,
    topic,
    location: location, // fixed: was incorrectly trying to set participants
    keywords: extractKeywords(content),
    signals,
    created_at: now.toISOString(),
    expires_at: expires.toISOString()
  };
  
  const active = getActiveResidues();
  active.push(residue);
  saveResidues(active);
  
  console.log(`[ResidueLogger] Deposited conversation residue: ${topic} (${signals.actionability.toFixed(2)} actionability)`);
  return residue;
}

// Deposit task residue when task is created/updated
export function depositTaskResidue(
  sessionId: string,
  taskId: string,
  title: string,
  status: string
): TaskResidue {
  const now = new Date();
  
  const residue: TaskResidue = {
    id: `task-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trace_type: "task_residue",
    source_session_id: sessionId,
    task_id: taskId,
    title,
    status,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: new Date(now.getTime() + DECAY_TIMES.task_residue).toISOString(),
    outcome: {
      human_approved: false,
      artifact_created: false,
      dead_end: false,
      repeated_issue_solved: false,
      spawned_followup_tasks: 0
    },
    related_conversations: [sessionId]
  };
  
  const active = getActiveResidues();
  active.push(residue as OfficeResidue);
  saveResidues(active);
  
  console.log(`[ResidueLogger] Deposited task residue: ${title} (${status})`);
  return residue;
}

// Update task residue when task status changes
export function updateTaskResidue(
  taskId: string,
  updates: Partial<TaskResidue>
): void {
  const active = getActiveResidues();
  const taskIndex = active.findIndex(r => 
    r.trace_type === "task_residue" && 
    (r as TaskResidue).task_id === taskId
  );
  
  if (taskIndex >= 0) {
    const updated = { ...active[taskIndex], ...updates, updated_at: new Date().toISOString() };
    active[taskIndex] = updated as OfficeResidue;
    saveResidues(active);
    console.log(`[ResidueLogger] Updated task residue: ${taskId}`);
  }
}

// Deposit delegation residue when someone asks for help
export function depositDelegationResidue(
  sessionId: string,
  delegator: string,
  delegatee: string,
  requestType: string
): DelegationResidue {
  const now = new Date();
  const expires = new Date(now.getTime() + DECAY_TIMES.delegation_residue);
  
  const residue: DelegationResidue = {
    id: `del-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trace_type: "delegation_residue",
    source_session_id: sessionId,
    delegator,
    delegatee,
    request_type: requestType,
    success_indicators: {
      useful_artifact_created: false,
      followup_requests: 0,
      escalation_rate: 0,
      solution_quality: 0.5
    },
    created_at: now.toISOString(),
    expires_at: expires.toISOString()
  };
  
  const active = getActiveResidues();
  active.push(residue);
  saveResidues(active);
  
  console.log(`[ResidueLogger] Deposited delegation residue: ${delegator} -> ${delegatee} (${requestType})`);
  return residue;
}

// Deposit spatial residue for location-based events
export function depositSpatialResidue(
  location: string,
  eventType: string,
  topic: string,
  participants: string[],
  intensity: number
): SpatialResidue {
  const now = new Date();
  const expires = new Date(now.getTime() + DECAY_TIMES.spatial_residue);
  
  const residue: SpatialResidue = {
    id: `spat-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trace_type: "spatial_residue",
    location,
    event_type: eventType,
    intensity: Math.min(1, Math.max(0, intensity)),
    topic,
    participants,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    metadata: {
      idea_survival_rate: 0.5, // default - will be updated by learning system
      blockage_frequency: 0.3, // default
      decision_latency: 15 // minutes default
    }
  };
  
  const active = getActiveResidues();
  active.push(residue);
  saveResidues(active);
  
  console.log(`[ResidueLogger] Deposited spatial residue: ${location} ${eventType} (${intensity.toFixed(2)} intensity)`);
  return residue;
}

// Deposit outcome residue when task completes or fails
export function depositOutcomeResidue(
  sessionId: string,
  taskId: string,
  outcomeType: string,
  successMetrics: {
    usefulness_score: number;
    time_to_completion: number;
    quality_indicators: Record<string, any>;
  }
): OutcomeResidue {
  const now = new Date();
  const expires = new Date(now.getTime() + DECAY_TIMES.outcome_residue);
  
  const residue: OutcomeResidue = {
    id: `out-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trace_type: "outcome_residue",
    source_session_id: sessionId,
    task_id: taskId,
    outcome_type: outcomeType,
    success_metrics: successMetrics,
    created_at: now.toISOString(),
    expires_at: expires.toISOString()
  };
  
  const active = getActiveResidues();
  active.push(residue as OfficeResidue);
  saveResidues(active);
  
  console.log(`[ResidueLogger] Deposited outcome residue: ${taskId} -> ${outcomeType} (${successMetrics.usefulness_score.toFixed(2)} usefulness)`);
  return residue;
}

// Helper function to calculate conversation signals
function calculateConversationSignals(content: string): {
  novelty: number;
  agreement: number;
  actionability: number;
  recurrence: number;
  urgency: number;
  emotional_intensity: number;
} {
  const contentLower = content.toLowerCase();
  
  // Novelty - based on uncommon words/topics
  const noveltyWords = ["innovative", "breakthrough", "novel", "new approach", "experiment"];
  let noveltyScore = 0;
  noveltyWords.forEach(word => {
    if (contentLower.includes(word)) noveltyScore += 0.2;
  });
  noveltyScore = Math.min(1, noveltyScore);
  
  // Agreement - based on agreement language
  const agreementWords = ["agree", "yes", "exactly", "absolutely", "correct", "right"];
  let agreementScore = 0;
  agreementWords.forEach(word => {
    if (contentLower.includes(word)) agreementScore += 0.15;
  });
  agreementScore = Math.min(1, agreementScore);
  
  // Actionability - based on action phrases
  const actionWords = ["should", "need to", "have to", "must", "let's", "we will", "going to"];
  let actionScore = 0;
  actionWords.forEach(word => {
    if (contentLower.includes(word)) actionScore += 0.2;
  });
  actionScore = Math.min(1, actionScore);
  
  // Recurrence - would need historical data, using placeholder
  const recurrenceScore = 0.5; // placeholder - would be calculated from history
  
  // Urgency - based on urgency indicators
  const urgencyWords = ["urgent", "asap", "immediately", "deadline", "critical", "emergency"];
  let urgencyScore = 0;
  urgencyWords.forEach(word => {
    if (contentLower.includes(word)) urgencyScore += 0.2;
  });
  urgencyScore = Math.min(1, urgencyScore);
  
  // Emotional intensity - based on emotional language and punctuation
  const emotionalWords = ["amazing", "terrible", "great", "awful", "love", "hate", "excited", "frustrated"];
  let emotionalScore = 0;
  emotionalWords.forEach(word => {
    if (contentLower.includes(word)) emotionalScore += 0.15;
  });
  // Boost for exclamation marks and caps
  const exclamationCount = (content.match(/!/g) || []).length;
  const capsRatio = (content.match(/[A-Z]/g) || []).length / Math.max(1, content.length);
  emotionalScore += Math.min(0.3, exclamationCount * 0.1 + capsRatio);
  emotionalScore = Math.min(1, emotionalScore);
  
  return {
    novelty: noveltyScore,
    agreement: agreementScore,
    actionability: actionScore,
    recurrence: recurrenceScore,
    urgency: urgencyScore,
    emotional_intensity: emotionalScore
  };
}

// Helper function to extract keywords from content
function extractKeywords(content: string): string[] {
  // Simple keyword extraction - in practice would use NLP
  const words = content.toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !["the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old", "see", "two", "who", "boy", "did", "man", "men", "put", "too", "any"].includes(w));
  
  // Return unique keywords, max 10
  return [...new Set(words)].slice(0, 10);
}

// Get residues by type
export function getResiduesByType(type: string): OfficeResidue[] {
  return getActiveResidues().filter(r => r.trace_type === type);
}

// Get residues by source session
export function getResiduesBySession(sessionId: string): OfficeResidue[] {
  return getActiveResidues().filter(r => 'source_session_id' in r && r.source_session_id === sessionId);
}

// Clear expired residues (maintenance function)
export function cleanupExpiredResidues(): number {
  const active = getActiveResidues();
  const now = new Date().toISOString();
  const valid = active.filter(r => !('expires_at' in r) || (r as any).expires_at > now);
  const removed = active.length - valid.length;
  
  if (removed > 0) {
    saveResidues(valid);
    console.log(`[ResidueLogger] Cleaned up ${removed} expired residues`);
  }
  
  return removed;
}