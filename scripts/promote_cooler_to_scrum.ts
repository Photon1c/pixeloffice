/**
 * Dev-only script to promote cooler sessions to SCRUM runs.
 * 
 * USAGE (for Leslie):
 * 
 * 1. First, ensure you have cooler sessions in Supabase:
 *    - The cooler_sessions table should have some sessions.
 *    - The cooler_messages table should have messages for those sessions.
 * 
 * 2. To promote a specific session by ID:
 *    npx tsx scripts/promote_cooler_to_scrum.ts --session-id <uuid>
 * 
 * 3. To promote the most recent non-candidate session:
 *    npx tsx scripts/promote_cooler_to_scrum.ts --latest
 * 
 * 4. To list available cooler sessions:
 *    npx tsx scripts/promote_cooler_to_scrum.ts --list
 * 
 * 5. To force promotion even if already promoted (for testing):
 *    npx tsx scripts/promote_cooler_to_scrum.ts --session-id <uuid> --force
 * 
 * VERIFYING RESULTS IN SUPABASE:
 * - Check cooler_sessions.is_scrum_candidate = true for promoted session
 * - Check scrum_runs table for new rows with source_cooler_session_id
 * - Check scrum_stage_events for 'intake' stage events
 * - Check tasks table for new tasks with source_session_id pointing to the cooler session
 */

import { promoteCoolerSession, getCooldownSessions, supabaseAdmin } from "../server/cooler/coolerToScrum.js";

interface Args {
  sessionId?: string;
  latest?: boolean;
  list?: boolean;
  force?: boolean;
}

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--session-id":
        args.sessionId = argv[++i];
        break;
      case "--latest":
        args.latest = true;
        break;
      case "--list":
        args.list = true;
        break;
      case "--force":
        args.force = true;
        break;
    }
  }
  
  return args;
}

async function listSessions() {
  console.log("\n=== Available Cooler Sessions ===\n");
  
  const { data: sessions } = await supabaseAdmin
    .from("cooler_sessions")
    .select("id, topic, relevance_score, is_scrum_candidate, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  
  if (!sessions || sessions.length === 0) {
    console.log("No cooler sessions found in database.");
    return;
  }
  
  for (const s of sessions) {
    console.log(`ID: ${s.id}`);
    console.log(`  Topic: ${s.topic || "(none)"}`);
    console.log(`  Relevance Score: ${s.relevance_score ?? "N/A"}`);
    console.log(`  Scrum Candidate: ${s.is_scrum_candidate}`);
    console.log(`  Created: ${s.created_at}`);
    console.log("");
  }
}

async function findLatestSession(): Promise<string | null> {
  const sessions = await getCooldownSessions(1);
  return sessions.length > 0 ? sessions[0].id : null;
}

async function main() {
  const args = parseArgs();
  
  console.log("\n=== Cooler to SCRUM Promotion Tool (Dev-Only) ===\n");
  
  if (args.list) {
    await listSessions();
    return;
  }
  
  let targetSessionId: string | undefined;
  
  if (args.sessionId) {
    targetSessionId = args.sessionId;
  } else if (args.latest) {
    console.log("Finding latest non-candidate session...");
    targetSessionId = await findLatestSession();
    if (!targetSessionId) {
      console.error("No eligible sessions found.");
      process.exit(1);
    }
    console.log(`Found session: ${targetSessionId}`);
  } else {
    console.error("Usage: tsx scripts/promote_cooler_to_scrum.ts --session-id <uuid> | --latest | --list");
    console.error("Use --force to re-promote an already promoted session.");
    process.exit(1);
  }
  
  console.log(`\nPromoting session: ${targetSessionId}`);
  console.log(`Force mode: ${args.force ? "ON" : "OFF"}\n`);
  
  const result = await promoteCoolerSession(targetSessionId, { force: args.force });
  
  console.log("\n=== Result ===");
  console.log(`Success: ${result.success}`);
  console.log(`Session ID: ${result.sessionId}`);
  console.log(`SCRUM Run ID: ${result.scrumRunId || "(none)"}`);
  console.log(`Tasks Created: ${result.tasksCreated}`);
  console.log(`Already Promoted: ${result.alreadyPromoted}`);
  console.log(`Reason: ${result.reason}`);
  
  if (result.success && !result.alreadyPromoted) {
    console.log("\n✓ Promotion successful! Check Supabase for:");
    console.log("  - cooler_sessions.is_scrum_candidate = true");
    console.log("  - scrum_runs table (new row)");
    console.log("  - scrum_stage_events table (intake event)");
    console.log("  - tasks table (new tasks)");
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});