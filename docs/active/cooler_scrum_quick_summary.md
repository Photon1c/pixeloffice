# Cooler → SCRUM Bridge Quick Summary

## What This Does
Promotes qualifying cooler conversations into structured SCRUM runs and tasks automatically.

## Files
- **`server/cooler/coolerToScrum.ts`** - Core promotion logic
- **`scripts/promote_cooler_to_scrum.ts`** - Dev CLI tool

## Heuristic (How It Decides)
Score = (tag_hits × 15) + (action_phrase_hits × 5), threshold = 20

**Trigger Tags:** burnout, productivity, tooling, performance, maintenance, deadline, urgent, blocker, friction, improvement

**Action Phrases:** "we should", "we need to", "someone has to", "let's", etc.

## Usage

```bash
# List available sessions
npx tsx scripts/promote_cooler_to_scrum.ts --list

# Promote latest session
npx tsx scripts/promote_cooler_to_scrum.ts --latest

# Promote specific session
npx tsx scripts/promote_cooler_to_scrum.ts --session-id <uuid>

# Force re-promote
npx tsx scripts/promote_cooler_to_scrum.ts --session-id <uuid> --force
```

## What Gets Created
1. `cooler_sessions.is_scrum_candidate = true`
2. `cooler_sessions.relevance_score` set
3. `scrum_runs` row (linked via `source_cooler_session_id`)
4. `scrum_stage_events` row (stage = "intake")
5. 1-3 `tasks` rows with action items

## Idempotency
Running twice on same session is safe — it detects existing `scrum_runs` and skips.

## Verify in Supabase
- `cooler_sessions` table → `is_scrum_candidate = true`
- `scrum_runs` table → new row with `source_cooler_session_id`
- `scrum_stage_events` table → "intake" stage
- `tasks` table → new tasks with `source_session_id`