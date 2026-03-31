# META_CONTRACT – Pixel Office vs Claw3D

This document defines the contract between **Pixel Office** and **Claw3D** in this ecosystem.

---

## 1. Roles and Metaphors

### Pixel Office = Fortress / Workshop / Forge

- **Primary role:** Backend and working environment where real work happens.
- **Metaphor:** The forge where wires get stripped, plans are sketched, and war-room decisions are made.
- **Activities:**
  - Deep SCRUM sessions that can run late into the night.
  - Cooler sessions (coffee breaks) that carry real technical and emotional context.
  - Layout and interior design optimized for *Leslie and the agents*, not for external spectators.
- **Expectations:**
  - Serious experimentation, refactors, and planning happen here.
  - It is allowed to be messy, in-progress, and text-heavy.
  - Visuals serve clarity and cognition first, aesthetics second.

### Claw3D = Showroom / Stage / Theatre

- **Primary role:** Front-end showroom and demo space for rendering nice-looking agent stand-ups and visualizations.
- **Metaphor:** The theatre where we show people a performance that has already been rehearsed many times in the back rooms.
- **Activities:**
  - Visual stand-ups and polished presentations of agent state.
  - 3D scenes and animations for demos, talks, or screenshare sessions.
  - High-level views of the system that are easy to watch and understand.
- **Expectations:**
  - No core logic or critical planning should *depend* on Claw3D.
  - It can read from stable backends and configs, but it should not silently own or rewrite them.
  - A failure in Claw3D should not compromise Pixel Office or OpenClaw’s core operation.

---

## 2. Division of Responsibility

### What belongs in Pixel Office

- SCRUM mechanics, cooler talk engines, and conversation grammars.
- Interior layouts that encode **who works where** and **how**.
- Heavy debugging, refactors, and planning sessions.
- Long-term memory and journals about how the office and tools evolve.

### What belongs in Claw3D

- Visual stand-ups and agent presentations.
- 3D scenes showing the office, agents, or infra status as a **demo surface**.
- UI affordances that make it easier to *watch* or *explain* what’s going on to others.

### What should be avoided

- **In Pixel Office:**
  - Flashy, demo-first features that distract from real work.
  - Over-animated or noisy visuals that make deep sessions harder.

- **In Claw3D:**
  - Core business logic or configuration that the rest of the system *requires* to function.
  - Silent edits to main OpenClaw configs (e.g., `~/.openclaw/openclaw.json`) without explicit intent and audit.

---

## 3. Config and Safety Principles

1. **Pixel Office and OpenClaw own the core configuration.**
   - Claw3D may read from these configs to render accurate state.
   - Any write behavior by Claw3D to shared configs must be:
     - Explicitly understood (documented), and
     - Narrowly scoped and intentional.

2. **Claw3D is an authorized key-holder, not the landlord.**
   - It may manage its own project/state files.
   - It should not be the sole owner of critical tokens or runtime wiring.

3. **Go 3D is an enhancement, not a requirement.**
   - Pixel Office must remain fully usable without Claw3D.
   - If Go 3D is unavailable, core workflows should still function.

---

## 4. Archival Intent

This contract is meant to be:
- Discoverable by HermitClaw (Archivist) and Zeroclaw (Specialist) as a guiding meta-rule.
- Duplicated into both the Claw3D and Pixel Office repos so future changes remember:
  - Pixel Office is the **fortress / backend**.
  - Claw3D is the **showroom / front-end**.

Future agents working in or around these tools should treat this META_CONTRACT as the source of truth for how responsibilities are divided between 2D Pixel Office and 3D Claw3D.

---

## 5. Enforcement & Guardrails

### Config Protection

- Shared configs (e.g. `~/.openclaw/openclaw.json`) should default to:
  - Read-only during runtime (`chmod 444`) unless actively edited by the user.
- Any tool attempting to write to shared configs must:
  - Fail loudly, and
  - Log intent before mutation.

---

### Write Boundaries

- Claw3D **must not write** to:
  - `~/.openclaw/`
  - Systemd service files
  - Token or credential stores

- Claw3D **may write only to**:
  - Its own project directory
  - Explicitly scoped cache/state folders

---

### Startup Dependency Rule

- Pixel Office must start and operate independently.
- Claw3D may depend on Pixel Office.
- Reverse dependency (Pixel Office depending on Claw3D) is strictly forbidden.

---

### Audit Rule

- Any configuration mutation must:
  - Be logged
  - Include the source (agent, tool, or process)
  - Include a timestamp

---

### Conflict Resolution Principle

- In cases of ambiguity or unexpected behavior:
  - Assume Pixel Office and OpenClaw core systems are correct by default.
  - Treat Claw3D and auxiliary tools as non-authoritative until verified.

---
