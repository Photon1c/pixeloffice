# Opencode Brief – Pixel Office Reliability & Workflow Tests

## Goal
Set up a repeatable set of checks (and future automated tests) that validate:

- Stigmergic behavior: **Review Heat**, **Task Shadows**, and (later) social potential.
- Cooler → SCRUM pipeline and Supabase writes.
- Public vs Lab mode gating (Netlify vs local).
- Basic app health: render, movement, and key UI interactions.

This brief is for **spec + light implementation** only. Focus on mapping where tests should hook in and, at most, creating a small smoke-test skeleton.

---

## 1. Manual Test Playbook (Short Term)

Define a small set of “scenes” that a human (Leslie) or Opencode can reliably run to check system health.

### 1.1 Cooler → Review Heat → SCRUM

**Scene:** Run a cooler session that talks about PR backlog / blocked reviews and confirm the full chain fires.

**Steps (conceptual):**

1. Trigger a cooler session (via UI or `curl`) with content like:
   - Mentions of review backlog, blocked PRs, waiting on approval, stale review, etc.
2. Verify:
   - **Review Heat** aura appears in the kitchen.
   - The cooler session gets **elevated SCRUM score** thanks to Review Heat.
   - A **SCRUM run** is created with:
     - A reason referencing Review Heat (e.g., "due to elevated Review Heat around PR backlog").
     - Linked entries in `scrum_runs`, `scrum_stage_events`, and `tasks` in Supabase.
3. Confirm via Supabase tables:
   - `cooler_sessions` (`is_scrum_candidate`, `relevance_score`)
   - `scrum_runs` (`source_cooler_session_id`, reason/metadata)
   - `scrum_stage_events` (initial `intake` event)
   - `tasks` (1–3 seeded tasks)

**What Opencode should produce:**

- A short, commented checklist in markdown (or near the code) describing the exact queries / UI elements to check.
- Identification of the primary functions/modules involved (e.g., `server/cooler/coolerToScrum.ts`, `server/cooler/stigmergy.ts`).

---

### 1.2 Task Shadows Influence

**Scene:** Demonstrate that desks/agents with stronger Task Shadows are more likely to be selected for follow-up (cooler or SCRUM) and/or appear in a hotspot panel.

**Steps (conceptual):**

1. Create a situation where an agent has unfinished work and is left idle long enough to accumulate Task Shadows.
2. Trigger an automatic cooler or test SCRUM session.
3. Verify:
   - Agents with heavier Task Shadows have a higher chance of being included in the session.
   - (If implemented) an "Unfinished Work Hotspots" panel shows those desks, with intensity.

**What Opencode should produce:**

- Notes on where Task Shadow intensity is stored/tracked (server or client-side state).
- A simple description of the weighting logic (e.g., how Task Shadows affect selection).
- Suggestions for how to test this deterministically later (e.g., seeding state or mocking intensity).

---

### 1.3 Public vs Lab Mode (Netlify vs Local)

**Scene:** Confirm UI gating behaves as expected in different environments.

**Conditions:**

- **Local dev** (`VITE_PUBLIC_MODE=false`, `VITE_LAB_MODE=true`)
  - Lab tools (Terminal, Sherlock CS, NightWatchauton, ClawGuard, Genealogy Lab, Admin Assistant, Stock Forecasts) are **visible**.
  - Live Mode / Show Names toggles are visible and work.
- **Netlify prod** (`VITE_PUBLIC_MODE=true`, `VITE_LAB_MODE=false`)
  - Only the core office view, Live Mode, and Show Names are visible.
  - No lab-only tools or debug/parameter panels.

**What Opencode should produce:**

- Documentation of the key DOM elements / selectors for these toggles and lab tools.
- A suggestion for simple UI checks (e.g., Playwright or a lightweight DOM test) that assert presence/absence based on `PUBLIC_MODE`/`LAB_MODE`.

---

## 2. Hooks for Future Automation

The goal here is to **identify** where automated tests should live, not to fully implement a test suite.

### 2.1 Stigmergy & Cooler → SCRUM Hooks

Opencode should:

- Map key endpoints and functions:
  - `server/cooler/stigmergy.ts` – Review Heat / Task Shadows APIs.
  - `server/cooler/coolerToScrum.ts` – cooler→SCRUM promotion logic.
- Propose where to put small tests that:
  - Call stigmergy endpoints with known inputs and verify safe, structured outputs.
  - Run the promotion logic on a seeded cooler session and assert that:
    - SCRUM creation occurs (or not) as expected.
    - Review Heat contribution is reflected in scoring.

### 2.2 UI Smoke Tests

- Suggest a minimal `tests/smoke/` layout (no need to fill it completely), e.g.:

  ```text
  tests/
    smoke/
      office_renders.spec.(ts|js)
      cooler_to_scrum.spec.(ts|js)
  ```

- For each suggested test, outline:
  - Entry point (local dev server vs Netlify preview).
  - What to assert (high-level DOM / text presence, no need for pixel-perfect checks).

---

## 3. Deliverables for This Brief

On a branch (no breaking changes):

1. A **markdown report** under `docs/opencode/` or `docs/active/` summarizing:
   - Where stigmergy, SCRUM, and mode-gating are wired.
   - Recommended test cases and their target functions/components.
   - Any gaps or edge cases discovered while inspecting the code.

2. (Optional, but preferred) A small **test skeleton**, such as:
   - `tests/smoke/office_renders.spec.ts` with a placeholder test.
   - Comments describing what each future test should validate.

3. No changes to production behavior beyond harmless logging or comments.

The emphasis is on **mapping and light scaffolding**, not on building a full test suite tonight.