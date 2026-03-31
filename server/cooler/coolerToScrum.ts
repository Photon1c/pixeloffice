import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { getTotalHeatIntensity } from "./reviewHeat.js";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("[coolerToScrum] Missing SUPABASE_URL or SUPABASE_KEY env vars");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SCRUM_TRIGGER_TAGS = ["burnout", "productivity", "tooling", "performance", "maintenance", "deadline", "urgent", "blocker", "friction", "improvement"];
const ACTION_PHRASES = ["we should", "we need to", "someone has to", "let's", "i think we need", "we ought to", "why don't we", "someone should"];

export interface CoolerMessage {
  id: string;
  created_at: string;
  cooler_session_id: string;
  agent_id: string;
  content: string;
  sentiment: string | null;
  tags: string[] | null;
}

export interface CoolerSession {
  id: string;
  topic: string | null;
  relevance_score: number | null;
  is_scrum_candidate: boolean;
}

export interface ScrumRun {
  id: string;
  source_cooler_session_id: string | null;
  source_session_id: string | null;
  title: string;
  status: string;
}

export interface Task {
  id: string;
  source_session_id: string | null;
  title: string;
  description: string;
  status: string;
}

export interface PromotionResult {
  success: boolean;
  sessionId: string | null;
  scrumRunId: string | null;
  tasksCreated: number;
  alreadyPromoted: boolean;
  reason?: string;
}

function detectRelevanceScore(messages: CoolerMessage[]): { score: number; themes: string[] } {
  let tagHits = 0;
  let actionPhraseHits = 0;
  const detectedThemes = new Set<string>();

  for (const msg of messages) {
    const contentLower = msg.content.toLowerCase();
    const msgTags = msg.tags || [];

    for (const tag of msgTags) {
      if (SCRUM_TRIGGER_TAGS.some(t => tag.toLowerCase().includes(t))) {
        tagHits++;
        detectedThemes.add(tag);
      }
    }

    for (const triggerTag of SCRUM_TRIGGER_TAGS) {
      if (contentLower.includes(triggerTag)) {
        tagHits++;
        detectedThemes.add(triggerTag);
      }
    }

    for (const phrase of ACTION_PHRASES) {
      if (contentLower.includes(phrase)) {
        actionPhraseHits++;
      }
    }
  }

  // STIGMERGY BOOST: Increase score based on active Review Heat in the system
  const heatBoost = getTotalHeatIntensity() * 30;
  const score = Math.min(100, (tagHits * 15) + (actionPhraseHits * 5) + heatBoost);
  if (heatBoost > 0) {
    console.log(`[Stigmergy] Applied Review Heat boost of ${heatBoost.toFixed(1)} to relevance score`);
  }
  
  return { score, themes: Array.from(detectedThemes) };
}

function generateTaskTitles(themes: string[], messages: CoolerMessage[]): { title: string; description: string }[] {
  const tasks: { title: string; description: string }[] = [];

  if (themes.length > 0) {
    tasks.push({
      title: `Address: ${themes[0]}`,
      description: `Follow up on topic "${themes[0]}" discussed in cooler session. Review conversation and determine next steps.`
    });
  }

  if (themes.length > 1) {
    tasks.push({
      title: `Investigate: ${themes[1]}`,
      description: `Deeper investigation needed for "${themes[1]}". Gather more context and stakeholder input.`
    });
  }

  const actionMessages = messages.filter(m => 
    ACTION_PHRASES.some(phrase => m.content.toLowerCase().includes(phrase))
  );

  if (actionMessages.length > 0) {
    const sampleAction = actionMessages[0].content.substring(0, 100);
    tasks.push({
      title: "Address action items from cooler chat",
      description: `Review actionable items: "${sampleAction}..."`
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      title: "Review cooler session topics",
      description: "Follow up on general discussion topics from the cooler session."
    });
  }

  return tasks.slice(0, 3);
}

export async function isSessionAlreadyPromoted(coolerSessionId: string): Promise<ScrumRun | null> {
  const { data } = await supabaseAdmin
    .from("scrum_runs")
    .select("*")
    .eq("source_cooler_session_id", coolerSessionId)
    .limit(1)
    .single();

  return data || null;
}

export async function promoteCoolerSession(
  coolerSessionId: string,
  options: { force?: boolean } = {}
): Promise<PromotionResult> {
  console.log(`[coolerToScrum] Starting promotion for session: ${coolerSessionId}`);

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, sessionId: coolerSessionId, scrumRunId: null, tasksCreated: 0, alreadyPromoted: false, reason: "Supabase not configured" };
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("cooler_sessions")
    .select("*")
    .eq("id", coolerSessionId)
    .single();

  if (sessionError || !session) {
    console.error("[coolerToScrum] Session not found:", sessionError);
    return { success: false, sessionId: coolerSessionId, scrumRunId: null, tasksCreated: 0, alreadyPromoted: false, reason: "Session not found" };
  }

  if (!options.force) {
    const existingRun = await isSessionAlreadyPromoted(coolerSessionId);
    if (existingRun) {
      console.log(`[coolerToScrum] Session already promoted to scrum run: ${existingRun.id}`);
      return { success: true, sessionId: coolerSessionId, scrumRunId: existingRun.id, tasksCreated: 0, alreadyPromoted: true, reason: "Already promoted" };
    }
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("cooler_messages")
    .select("*")
    .eq("cooler_session_id", coolerSessionId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("[coolerToScrum] Error fetching messages:", messagesError);
    return { success: false, sessionId: coolerSessionId, scrumRunId: null, tasksCreated: 0, alreadyPromoted: false, reason: "Failed to fetch messages" };
  }

  const { score, themes } = detectRelevanceScore(messages as CoolerMessage[]);
  console.log(`[coolerToScrum] Relevance score: ${score}, themes: ${themes.join(", ")}`);

  const SCORE_THRESHOLD = 20;
  if (score < SCORE_THRESHOLD && !options.force) {
    console.log(`[coolerToScrum] Session below threshold (${score} < ${SCORE_THRESHOLD}), skipping`);
    return { success: true, sessionId: coolerSessionId, scrumRunId: null, tasksCreated: 0, alreadyPromoted: false, reason: "Below relevance threshold" };
  }

  await supabaseAdmin
    .from("cooler_sessions")
    .update({ is_scrum_candidate: true, relevance_score: score })
    .eq("id", coolerSessionId);

  const runTitle = themes.length > 0 
    ? `SCRUM: ${themes[0].charAt(0).toUpperCase() + themes[0].slice(1)}`
    : "SCRUM: Cooler Session Follow-up";

  const { data: scrumRun, error: runError } = await supabaseAdmin
    .from("scrum_runs")
    .insert({
      source_cooler_session_id: coolerSessionId,
      source_session_id: coolerSessionId,
      title: runTitle,
      status: "pending",
      summary: `Promoted from cooler session. Themes: ${themes.join(", ") || "general discussion"}. Score: ${score}`
    })
    .select()
    .single();

  if (runError || !scrumRun) {
    console.error("[coolerToScrum] Failed to create scrum run:", runError);
    return { success: false, sessionId: coolerSessionId, scrumRunId: null, tasksCreated: 0, alreadyPromoted: false, reason: "Failed to create scrum run" };
  }

  console.log(`[coolerToScrum] Created scrum run: ${scrumRun.id}`);

  await supabaseAdmin
    .from("scrum_stage_events")
    .insert({
      scrum_run_id: scrumRun.id,
      stage: "intake",
      payload: {
        source: "cooler_promotion",
        original_topics: themes,
        relevance_score: score,
        message_count: messages?.length || 0,
        summary: messages?.slice(0, 3).map(m => m.content.substring(0, 80)).join(" | ") || "No messages"
      }
    });

  const taskTemplates = generateTaskTitles(themes, messages as CoolerMessage[]);
  let tasksCreated = 0;

  for (const taskTemplate of taskTemplates) {
    const { error: taskError } = await supabaseAdmin
      .from("tasks")
      .insert({
        source_session_id: coolerSessionId,
        title: taskTemplate.title,
        description: taskTemplate.description,
        status: "pending",
        tags: themes.length > 0 ? themes : null
      });

    if (!taskError) {
      tasksCreated++;
    }
  }

  console.log(`[coolerToScrum] Created ${tasksCreated} tasks for scrum run ${scrumRun.id}`);

  return {
    success: true,
    sessionId: coolerSessionId,
    scrumRunId: scrumRun.id,
    tasksCreated,
    alreadyPromoted: false,
    reason: "Successfully promoted"
  };
}

export async function getCooldownSessions(limit: number = 10): Promise<CoolerSession[]> {
  const { data } = await supabaseAdmin
    .from("cooler_sessions")
    .select("*")
    .eq("is_scrum_candidate", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}