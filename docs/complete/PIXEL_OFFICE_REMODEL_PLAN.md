# Pixel Office Remodel – Architectural Plan (Draft)

**Date:** 2026-03-18 (prep draft)  
**Author:** Leslie (+ Sherlock)  
**Status:** Planning – for implementation after conversation engine work stabilizes

---

## 1. Goals

- Move from “wires and sprites on a canvas” to a **coherent office organism** with clear anatomy.
- Give each agent a **spatially meaningful home** that matches their role (custodian, clerk, specialist, executive).
- Provide **named zones** (gym, kitchen, exec suites, conference rooms, open workstations) that:
  - Anchor cooler talk and future SCRUM rituals.
  - Act as emotional waypoints (quiet, social, intense focus, etc.).
- Make the environment a **first-class part of the conversation engine**:
  - Where something is said matters (gym banter vs. exec war room vs. hallway aside).

---

## 2. High-Level Zoning

Working draft of the office “organs”:

1. **Lobby & Reception**
   - Entry point from “outside world”.
   - Hosts:
     - `Frontdesk` (Receptionist, canonical front door).
   - Function:
     - Greet visitors, route to appropriate zones/agents.
   - Mood: bright, welcoming, low cognitive load.

2. **Kitchen & Cooler Area**
   - Social hub for **Cooler Talk** sessions.
   - Hosts:
     - Temporary gathering spots for multiple agents.
   - Function:
     - Casual conversation, low-stakes experimentation for conversation engine.
   - Mood: informal, slightly noisy, safe for jokes and small anxieties.

3. **Open Office Workstations**
   - Shared work area for operational agents.
   - Hosts:
     - `OpenClaw` (Clerk / backbone).
     - `Ironclaw` (Custodian).
     - Possibly other “hands-on” workers.
   - Function:
     - Daily operational activity, routing, monitoring, maintenance.
   - Mood: steady, utilitarian, always-on.

4. **Archives & Records**
   - Quiet, back-of-house archive.
   - Hosts:
     - `Hermitclaw` (Archivist).
   - Function:
     - Long-term memory, logs, historical context.
   - Mood: calm, low-traffic, reflective.

5. **Executive & Specialist Suites**
   - Private / semi-private offices for high-focus work.
   - Hosts:
     - `LeslieClaw` (Executive).
     - `Zeroclaw` (Heavy specialist).
     - `Sherlobster` (Specialist investigator, exec partner).
     - `Hercule Prawnro` (Specialist investigator, exec partner).
   - Function:
     - Strategic planning, deep investigation, high-leverage decision-making.
   - Mood: quiet, protected, serious but not sterile.

6. **Conference & War Rooms**
   - Dedicated collaboration spaces.
   - Future home for:
     - SCRUM sessions.
     - Incident reviews.
     - Design discussions.
   - Function:
     - Structured conversation, agendas, outcomes.
   - Mood: focused, bounded time, clear beginnings/ends.

7. **Gym / Wellness Area**
   - Symbolic space for “system health” and decompression.
   - Hosts:
     - Agents off-duty, informal.
   - Function:
     - Represents maintenance of human + system resilience.
   - Mood: playful, low-stakes, offers contrast to high-intensity rooms.

---

## 3. Agent Placement (Initial Draft)

Using `AGENT_ROLES.md` as the source of truth:

- **Frontdesk**
  - Zone: Lobby & Reception.
  - Role: Primary receptionist and external entrypoint.
  - Notes: Handles first contact, light routing, visitor orientation.

- **OpenClaw**
  - Zone: Open Office Workstations.
  - Role: Clerk / orchestration backbone.
  - Notes: Near dashboards, status panels, queues.

- **Ironclaw**
  - Zone: Open Office Workstations (near infrastructure / “machine room” edge).
  - Role: Custodian / infra maintenance.
  - Notes: Visual proximity to servers/cables, but still in human-visible space.

- **Hermitclaw**
  - Zone: Archives & Records.
  - Role: Archivist / long-term memory.
  - Notes: Off main traffic, close to exec/specialist suites via a side corridor.

- **LeslieClaw**
  - Zone: Executive Suite.
  - Role: Executive / strategy, priorities.
  - Notes: Overlooks office (conceptually), easy path to conference rooms.

- **Zeroclaw**
  - Zone: Specialist Suite (adjacent to exec suite).
  - Role: Heavy specialist / deep reasoning.
  - Notes: Slightly separated for “spin up the big model” work.

- **Sherlobster**
  - Zone: Specialist Suite (near Hercule & Leslie).
  - Role: Specialist investigator / executive partner.
  - Notes: No longer treated as lobby staff; has a door, privacy, and clear focus.

- **Hercule Prawnro**
  - Zone: Specialist Suite (investigation office).
  - Role: Specialist investigator / executive partner.
  - Notes: Near archives and exec suite; path to conference rooms for briefings.

---

## 4. Interaction Patterns for Conversation Engine

How the remodel should influence conversations:

- **Cooler Talk**
  - Always visually and logically located in **Kitchen & Cooler Area**.
  - Participants:
    - Drawn from across zones, but gatherings *happen there*, not in random hallways.
  - Future rule: topics may subtly reflect where people came from (e.g., infra agents bring up stability, execs bring up planning).

- **Future SCRUM**
  - Anchored in a **Conference Room**.
  - Participants:
    - Selected by role and current workload.
  - Visual:
    - Agents leave their zones → move into meeting room → return.

- **Private Consults (Exec + Specialists)**
  - 1:1 or small group chats in **Exec/Specialist Suites**.
  - Less noise, deeper threads, more personal/emotional content.

- **Archives Interactions**
  - Calm, slow conversations with `Hermitclaw` about history, prior logs, patterns.
  - Location-aware: stepping into the archive visually signals “long view” mode.

---

## 5. Implementation Notes for Tomorrow

When you pick this up:

1. **Decide on a rough floorplan sketch**
   - Even a quick ASCII or box diagram:
     - Lobby → Open Office → Kitchen on one axis,
     - Archives + Exec/Specialists + Conference forming a quieter wing.

2. **Adjust layout config**
   - Update whatever file defines agent coordinates / zones (e.g., layout utilities) to:
     - Place agents in their new homes.
     - Reserve space for gym, conference, archives, etc., even if minimally drawn.

3. **Align visuals with roles**
   - Lightly label zones on the canvas (text overlays or subtle signage):
     - “Lobby”, “Kitchen”, “Archives”, “Exec Suite”, “War Room”, “Gym”.
   - Make sure Sherlobster is no longer visually in the front desk cluster.

4. **Leave hooks for the conversation engine**
   - Add simple tags or IDs to zones so future logic can say:
     - `location: "kitchen"` for cooler talk.
     - `location: "conference_room_1"` for SCRUM.
     - `location: "exec_suite"` for high-level planning.

---

## 6. Open Questions / To-Do Later

- How many conference rooms do we need (e.g., “War Room” vs. “Planning Room”)?
- Where does ground-station integration live? (Separate “Mission Control” room vs. part of Ops Center.)
- Do we want visual indicators of:
  - Current active conversations.
  - Which zones are “busy” vs. “quiet” at a glance?
