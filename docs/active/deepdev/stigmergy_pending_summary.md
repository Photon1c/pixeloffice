# Stigmergy Reference – What’s Implemented vs Pending (2026-03-31)

This note summarizes how much of `docs/active/stigmergy_reference.md` is actually implemented in Pixel Office today, and what remains aspirational.

---

## Implemented (or Partially Implemented)

### 1. Task Shadows
- **Status:** Implemented (core visuals + some logic in progress)
- **What exists now:**
  - Visual: blue/fading footprints at desks where agents have unfinished work.
  - Logic: being wired so that Task Shadow intensity can:
    - Influence which agents/sessions get selected (e.g., for cooler or SCRUM).
    - Optionally feed an "Unfinished Work Hotspots" panel.
- **How it maps to the spec:**
  - Matches the "Task Shadows" trail pheromone type (marking unfinished work, with decay over time), but implemented as a lightweight feature, not via the full proposed SQL grid + vector math.

### 2. Review Heat
- **Status:** Implemented (visual + behavioral integration)
- **What exists now:**
  - Visual: orange / warm aura in the kitchen when cooler talk centers on PR backlog, review bottlenecks, etc.
  - Logic:
    - Feeds into cooler → SCRUM scoring as an additional term.
    - SCRUM runs influenced by Review Heat can be annotated in metadata/UI (badges, reasons).
- **How it maps to the spec:**
  - Implements the "Review Heat" alarm pheromone idea (signaling code review bottlenecks), again using a simpler mechanism instead of full spatial diffusion and role-specific chemotaxis.

---

## Not Yet Implemented (or Only Loosely Approximated)

### 1. Other Field Types

**Social Potential**
- **Spec:** aggregation field created when agents cluster (especially at the water cooler), acting as an attractor and potentially triggering SCRUM "phase transitions".
- **Status:**
  - Agents move into kitchen/conference zones and trigger cooler/SCRUM via heuristics.
  - No explicit `social_potential` scalar or dedicated visual meter yet.
- **Pending work:**
  - Implement a simple social activity metric (e.g., recent cooler session count + participants) and an associated "social activity" UI meter.
  - Optionally, tie this into SCRUM scoring when combined with Review Heat.

**Dependency Trails**
- **Spec:** slow-decaying filaments between desks/repos that guide collaborative movement and attention, linked to GitHub issues/PRs.
- **Status:** not implemented.
- **Pending work:**
  - Any representation of cross-desk or desk↔repo "filaments" and their influence on navigation/collaboration.

**Distraction Fields**
- **Spec:** repellent fields for low-productivity zones (too much idle time, etc.), visually manifested as "noisy" static.
- **Status:** not implemented.
- **Pending work:**
  - Define conditions for "distraction" (e.g., idle time without progress) and modest repellent behavior/visuals.

### 2. Agent "Field Physics" (Chemotaxis)

- **Spec:**
  - Agents have sensors, sensitivities per pheromone type, and a `chemotaxisMove()` method that follows gradients up or down based on field values.
  - Roles differ in how they respond to different fields (e.g., review-sensitive vs social-sensitive agents).
- **Status:**
  - Agents currently move via scripted positions (desk, kitchen, conference) and simple wandering.
  - No generalized gradient-following or role-dependent field sampling yet.
- **Pending work:**
  - Any genuine gradient-driven movement (even a small experiment) and role-based sensitivity parameters.

### 3. Unified Spatial Grid / DB Model

- **Spec:**
  - `pheromone_fields` SQL table (MySQL), spatial indices, partitioning by layer type, and POINT-based queries.
- **Status:**
  - Review Heat and Task Shadows are managed through simpler state/JSON mechanisms.
  - No general-purpose multi-layer grid persisted in DB.
- **Pending work:**
  - If desired, a consolidated stigmergy store (even a trimmed-down table) for all field types, with clear read/write APIs.

### 4. Full StigmergicEngine Middleware

- **Spec:**
  - A reusable `StigmergicField` class with diffusion, evaporation, and sampling.
  - A React overlay consuming a central store (`useStigmergicStore`) and rendering all traces.
- **Status:**
  - Feature-specific logic exists (for Review Heat and Task Shadows), but not a single multi-layer engine.
- **Pending work:**
  - A generalized engine remains a future option; for now, discrete features and direct wiring are being used by design.

---

## Recommended Near-Term Focus (Given Current State)

Given what’s already in place and what Opencode is working on, the most practical next stigmergic steps are:

1. **Social Potential (lightweight)**
   - Implement a `social_potential` metric based on recent cooler activity (sessions + participants).
   - Surface it as a small UI meter near the cooler.
   - Optionally, factor it into SCRUM scoring when combined with Review Heat.

2. **Finish Task Shadow Influence**
   - Complete the wiring so Task Shadows:
     - Bias agent/session selection for cooler/SCRUM.
     - Optionally appear in an "Unfinished Work Hotspots" panel.

3. **Refine Review Heat Integration**
   - Tune how much Review Heat contributes to SCRUM scoring.
   - Ensure SCRUMs influenced by Review Heat are clearly labeled in UI and logs.

Larger, more complex elements from `stigmergy_reference.md` (Dependency Trails, Distraction Fields, full chemotaxis, spatial SQL engine) can be treated as **Phase 2+** features, once the current simpler fields are stable and demonstrably useful.
