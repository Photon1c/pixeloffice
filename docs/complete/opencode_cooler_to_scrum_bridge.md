# OpenCode Brief – Cooler Sessions → SCRUM Bridge (Pixel Office)

## Goal

Make Pixel Office cooler sessions **actionable** by automatically promoting qualifying conversations into structured SCRUM runs and/or tasks.

This is NOT about UI polish; it’s about wiring a reliable pipeline from:

> cooler_sessions + cooler_messages → scrum_runs + tasks (+ artifacts)

so that relevant cooler talk becomes visible work instead of disappearing.

---

## Context

Backend storage is in Supabase (Postgres). Phase 1 schema already exists and is applied:

- `cooler_sessions` – specialization of `sessions` for cooler talk.
- `cooler_messages` – individual chatter lines in a cooler session.
- `scrum_runs` – structured follow-up sessions.
- `scrum_stage_events` – timeline entries per SCRUM run.
- `tasks` – actionable items.
- `artifacts` – summaries/exports/diagrams.

See: `docs/active/supabase_phase1_schema.sql` for exact table definitions.

Supabase client entrypoint (frontend):
- `src/utils/supabaseClient.ts`

The frontend already has cooler-talk behavior; this brief is about **adding a promotion layer**, not reinventing cooler talk itself.

---

## High-Level Behavior

When a cooler session crosses a relevance/urgency threshold (e.g., repeated mentions of burnout, tooling friction, office productivity, model performance, repo maintenance), the system should be able to:

1. Mark that cooler session as SCRUM-worthy in `cooler_sessions`:
   - `is_scrum_candidate = true`
   - Optionally, a `relevance_score` > some threshold.

2. Create a corresponding `scrum_runs` record that is clearly linked back to the source:
   - `source_cooler_session_id` → the qualifying cooler session.
   - Optional: `source_session_id` if the cooler session’s base `sessions` row is relevant.

3. Seed either or both of:
   - `tasks` – 1–3 concrete "next steps".
   - `scrum_stage_events` – an initial `"intake"` stage event summarizing why this run exists.

4. Optionally create an `artifacts` row for a generated summary (even if initially just a placeholder text summary).

The primary success measure: **cooler conversations that matter produce visible `scrum_runs` / `tasks` records we can query later.**

---

## Scope for This Task

1. **Detection heuristic (server-side or shared)**
   - Implement a simple, explainable heuristic to decide when a cooler session should be marked as a SCRUM candidate:
     - Inputs: `cooler_messages.content`, `tags`, and optionally `sentiment`.
     - Examples of triggers:
       - Repeated occurrences of tags like `"burnout"`, `"productivity"`, `"tooling"`, `"performance"`.
       - A certain number of messages mentioning "we should", "we need to", "someone has to", etc.
   - This heuristic can be implemented as:
     - A pure TypeScript function that inspects the messages for a session, OR
     - A small backend helper under `server/` if that’s more appropriate.

2. **Promotion function**
   - Implement a function that, given a cooler session ID:
     - Fetches that session + its messages from Supabase.
     - Runs the heuristic.
     - If NOT a candidate: no-op (or just logs decision).
     - If a candidate:
       - Sets `cooler_sessions.is_scrum_candidate = true` and optionally sets a `relevance_score`.
       - Creates a new `scrum_runs` row linked via `source_cooler_session_id`.
       - Creates an initial `scrum_stage_events` row with `stage = 'intake'` and a payload summarizing the theme(s).
       - Creates 1–3 `tasks` rows seeded from the conversation (titles + descriptions derived from the cooler chat themes).

3. **Dev-only trigger**
   - Add a simple development-only trigger path so Leslie can test this without a full UI redesign:
     - For example, a debug button or CLI-style entrypoint (under `scripts/`) that:
       - Takes a `cooler_session_id` as input (or picks the most recent one).
       - Calls the promotion function.
   - This should be safe to delete or hide later; the important part is making the pipeline testable.

---

## Technical Constraints & References

- Supabase access:
  - Use `src/utils/supabaseClient.ts` for any frontend-side Supabase calls.
  - If implementing server-side helpers, ensure they respect existing environment configuration (do **not** hard-code Supabase keys or URLs).
- Schema:
  - Tables and columns are defined in `docs/active/supabase_phase1_schema.sql`.
- Existing integration checklist:
  - `docs/active/opencode_supabase_netlify_deployment.md` tracks broader wiring; this brief is specifically for the cooler→SCRUM promotion behavior.

---

## Acceptance Criteria

1. **Data-level**
   - Given a cooler session with messages that meet the heuristic:
     - `cooler_sessions.is_scrum_candidate` is set to `true` for that session.
     - A new `scrum_runs` row exists with `source_cooler_session_id` referencing that session.
     - At least one `scrum_stage_events` row exists with:
       - `scrum_run_id` set to the new run.
       - `stage = 'intake'`.
     - At least one `tasks` row exists whose `source_session_id` and/or semantics clearly tie back to that cooler session.

2. **Safety / Idempotence**
   - Running the promotion function twice on the same cooler session does **not** create unbounded duplicate `scrum_runs`.
     - Either it recognizes an existing run and bails, or it behaves idempotently.

3. **Observability for Leslie**
   - There is a documented way (in comments or a short `README` snippet near the code) for Leslie to:
     - Create a test cooler session (or identify an existing one).
     - Trigger the promotion.
     - Verify results in Supabase (via the web UI or a quick script).

4. **No UI regressions**
   - Existing cooler talk behavior continues to work as before.
   - Any new UI or debug buttons are clearly marked dev-only and do not confuse normal use.

---

## Where to Put Things (Guidance)

- Heuristic + promotion logic:
  - Prefer a small, well-named module, e.g. `server/cooler/coolerToScrum.ts` or similar.
- Dev/test entrypoint:
  - Consider a script under `scripts/` (e.g. `scripts/promote_cooler_to_scrum.ts`) that can be run with `tsx`.
- Documentation:
  - If adding docs, extend this file or add a short note under `docs/active/` describing usage.

The aim is to give Pixel Office a **simple, testable bridge** from social cooler talk to concrete SCRUM runs and tasks, without overcomplicating the first iteration.