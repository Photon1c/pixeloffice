# Opencode Brief – Pixel Office Stigmergy: Next Fields & Behaviors

## Goal
Now that **Review Heat** and **Task Shadows** are live in Pixel Office, extend their influence from pure visuals into concrete behavior and workflows. Implement small, end-to-end changes that:

- Use stigmergic fields to modulate SCRUM promotion and follow-up behavior.
- Surface lightweight, legible signals in the UI (no heavy engine rewrite).

This brief is intentionally incremental and should build on the existing stigmergy + cooler→SCRUM implementation.

---

## 1. Review Heat → SCRUM Bridge Integration

### Objective
Make **Review Heat** a first-class input into the cooler→SCRUM promotion pipeline, so that elevated review-related pressure increases the likelihood and priority of SCRUM runs.

### Tasks

1. **Incorporate Review Heat into SCRUM scoring**
   - Locate the cooler→SCRUM promotion logic (e.g., `server/cooler/coolerToScrum.ts` or equivalent).
   - For a given cooler session under evaluation:
     - Query the current Review Heat intensity relevant to that session (e.g., by session id, topic, or associated repo/PR).
   - Adjust the heuristic score, for example:
     - `final_score = base_score + (review_heat_intensity * 30)`
     - Where `review_heat_intensity` is clamped to [0,1].
   - Ensure behavior is explainable: log the contribution from Review Heat when a session crosses the threshold.

2. **Annotate SCRUM runs with stigmergic context**
   - When a SCRUM run is created from a cooler session influenced by Review Heat:
     - Add a human-readable reason field/payload to `scrum_runs` and/or `scrum_stage_events`, e.g.:
       - `"Scrum triggered due to elevated Review Heat around stale PR backlog in repo X."`
   - This should be stored alongside the run so we can later see why it was promoted.

3. **UI indicator on SCRUM cards**
   - In the frontend SCRUM UI (wherever SCRUM runs are listed or visualized):
     - Add a small badge or icon when a run was influenced by Review Heat.
       - Example: a small orange "heat" icon or label: `"Review Heat"`.
   - Tooltip/text should explain: "This SCRUM was promoted in part due to elevated Review Heat (review-related pressure)."

4. **Logging / Observability**
   - Add lightweight logs for:
     - Review Heat intensity value used during SCRUM scoring.
     - Final score and whether the session was promoted.
   - This will make it easier to tune `* 30` or similar weights later.

---

## 2. Task Shadows → Follow-Up & Session Selection

### Objective
Turn **Task Shadows** from a purely visual cue into a behavioral signal that nudges follow-up work and session selection.

### Tasks

1. **Track "heavy" Task Shadow locations**
   - On the backend or in a small state module:
     - Maintain a simple view of Task Shadow intensity per desk/agent (e.g., average or max over a recent window).
     - Identify the top N desks/agents with lingering shadows above a threshold.

2. **Influence cooler/SCRUM selection**
   - When automatically selecting agents or topics for **cooler sessions** or **test SCRUM**:
     - Slightly bias toward agents with higher Task Shadow intensity, e.g.:
       - Increase their selection weight.
   - Keep the behavior simple and explainable (e.g., a small multiplier rather than a hard rule).

3. **Optional: Task Shadow summary panel**
   - Add a minimal UI element (panel or sidebar entry) listing the top desks/agents with notable Task Shadows:
     - e.g. `"Unfinished Work Hotspots"` showing:
       - Agent name / desk
       - Relative intensity (e.g., 0.0–1.0 or a simple 1–3 bar visualization)
   - This panel can be visible in lab mode; public mode can show a lighter/simplified version or omit it.

4. **Logging / notes**
   - Log when Task Shadow intensity meaningfully influences agent selection for a session.
   - Keep the implementation small—no need for a complex engine; simple counters or decay-on-read logic is fine.

---

## 3. Social Potential Around the Cooler (Lightweight Field)

### Objective
Add a simple **social activity** signal around the water cooler that reflects how often and how many agents gather there, and use it as a secondary input to SCRUM promotion or office "mood".

### Tasks

1. **Define a simple Social Potential metric**
   - For a recent time window (e.g., last 30–60 minutes):
     - Count:
       - Number of cooler sessions.
       - Aggregate number of agents participating.
     - Derive a scalar `social_potential` in [0,1], e.g.:
       - Normalize by a configured max sessions/participants per window.

2. **Use Social Potential in behavior**
   - Option A (simplest):
     - If `social_potential` is high **and** Review Heat is high, modestly increase the cooler→SCRUM score.
   - Option B (visual-only for now):
     - Use `social_potential` to adjust a small UI meter near the cooler, without changing SCRUM behavior yet.
   - Keep the math simple; the goal is a legible signal, not a complex model.

3. **UI: Social Activity Meter**
   - Add a compact UI element (e.g., a small horizontal bar or icon) near the cooler area or in a status HUD:
     - Indicates current social activity (low → high).
     - Tooltip: `"Recent cooler activity (sessions & participants)."`

4. **Future-proofing notes**
   - Document where the Social Potential metric lives in code (e.g., `stigmergy/socialField.ts` or similar).
   - Keep it independent enough that we can later wire it into more advanced behaviors (e.g., spontaneous scrum triggers, mood changes) without refactoring the entire office.

---

## Files Likely Involved (Guidance, Not Exhaustive)

- Backend / server:
  - `server/cooler/coolerToScrum.ts`
  - `server/cooler/stigmergy.ts`
  - Any helper/service modules that track stigmergic traces
- Frontend:
  - `src/components/PixelOffice.tsx`
  - SCRUM and cooler session UI components
  - Existing stigmergy overlays or status HUD components

Please prefer small, well-scoped changes with clear logging and annotations over large refactors. The intent is to make the existing stigmergic fields meaningfully influence behavior, not to introduce a full new engine.