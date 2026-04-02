# Pixel Office – Autonomy Levels

> Internal deep-dev note (2026-03-31). This file is for design and thinking about autonomy, not a user-facing spec.

Goal: define clear levels of autonomy for Pixel Office behaviors so we can let the office act semi-autonomously (leaning toward autonomous) without losing human control over structure, security, and intent.

---

## 1. Autonomy Zones (Green / Yellow / Red)

**Green – Fully Autonomous (low risk)**
- System can act without explicit approval.
- Actions are reversible, limited in scope, and do not affect security or data integrity.

**Yellow – Propose / Approve (medium risk)**
- System can sense, analyze, and propose actions.
- A human (or explicit approver agent) must confirm before changes take effect.

**Red – Human Only (high risk)**
- Changes must be initiated and confirmed by a human.
- System may provide diagnostics, but not direct actions.

---

## 2. Map of Behaviors to Autonomy Levels

### 2.1 Stigmergic Fields

**Review Heat**
- **Computation & updating**: **Green**
  - Can be fully automatic based on cooler sessions and review-related signals.
- **Influence on SCRUM scoring**: **Yellow**
  - Safe to use as an input to heuristics that *propose* SCRUMs.
  - Actual creation of SCRUMs can be auto in low-stakes contexts, but we should log and allow overrides.

**Task Shadows**
- **Computation & visualization**: **Green**
  - Automatically deposit / decay shadows based on unfinished work and idle time.
- **Influence on agent/session selection**: **Yellow**
  - Allowed to bias which agents are pulled into cooler/SCRUM sessions.
  - Should remain a soft influence (weights) rather than hard constraints.

**Social Potential (future)**
- **Metric calculation**: **Green**
  - Count sessions/participants, derive social activity.
- **Behavioral influence**: **Yellow**
  - May adjust SCRUM promotion likelihood or simply be a visual meter.

> **Rule:** stigmergic fields are computed from behavior and data and are **never directly edited via GUIs**. They are read-only inputs to decision-making.

---

### 2.2 Cooler → SCRUM Pipeline

**Detect + score cooler sessions**
- **Scoring & candidate marking**: **Green**
  - Automatic scoring and `is_scrum_candidate` flags are okay.

**SCRUM creation**
- **Auto-creation based on high scores + stigmergy**: **Yellow**
  - System can auto-create SCRUM runs when thresholds are crossed, but:
    - Must log clearly why (tags, action phrases, Review Heat, etc.).
    - Should be easy to override or mark as "noise" later.

**Task creation from SCRUM**
- **Seeding tasks**: **Yellow**
  - Auto-creating a small set of tasks from cooler themes is fine.
  - Deleting or reclassifying them should remain easy for humans.

**Schema / DB changes**
- **Any migration or table change**: **Red**
  - Human-only. System can suggest migrations but not execute them.

---

### 2.3 Layout & Environment

**Visual layout (rooms, furniture, positions)**
- **Minor cosmetic tweaks** (colors, posters, small props): **Green**
  - Can be updated autonomously if reversible and controlled.
- **Desk positions, room boundaries, circulation paths**: **Yellow**
  - Agents/tools can propose layout changes, but require approval.
  - These changes affect mental models; keep them reviewable.

**Stigmergic field definitions / parameters**
- **Decay rates, weightings, field types**: **Red**
  - Changes here alter the "physics" of coordination.
  - Human review required for any change.

---

### 2.4 Code & Configuration

**Code changes (src/, server/, config)**
- **Edits via Agent Workspace Editor (future)**: **Yellow**
  - Agents can draft proposals, but merging requires human approval.

**Secrets, keys, security posture**
- **Any change to env vars, Supabase policies, or keys**: **Red**
  - System may surface health checks and warnings.
  - Humans must make the change.

---

## 3. Semi-Autonomous Pattern for Pixel Office

### Inner loops (autonomous):

- Compute stigmergic fields continuously.
- Rank cooler sessions, SCRUM candidates, and hotspots.
- Suggest work blocks or focus areas based on Review Heat and Task Shadows.
- Clean up old traces, cap maximum intensities, and archive as needed.

### Outer loops (human-in-the-loop):

- Approve or reject SCRUMs and tasks generated from cooler sessions.
- Approve layout changes and new features.
- Approve code and configuration changes via PRs / proposals.

The system should **always be drafting**: agendas, SCRUMs, hotspots, layout tweaks, and reports. Humans (or explicit approver agents under human control) decide what moves from draft to reality.

---

## 4. Practical Next Steps (When We’re Ready)

- Add small annotations in relevant docs/code indicating the autonomy level (Green/Yellow/Red) for major features.
- When implementing the Agent Workspace Editor:
  - Hard-code that stigmergic fields are read-only.
  - Restrict editable domains to layout/config/UX files in initial versions.
- Consider small, automated maintenance jobs for Green-zone actions:
  - Nightly trace cleanup.
  - "State of the office" summary generation.

This document is intentionally high-level; it’s meant to keep our instincts aligned when we later add more automation around Pixel Office.
