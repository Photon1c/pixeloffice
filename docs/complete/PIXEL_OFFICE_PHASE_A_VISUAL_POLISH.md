# Pixel Office Phase A – Visual & Animation Polish

**Repo:** `~/apps/pixelworld/pixel_office`  
**Context:** CoolerSession + SCRUM are fully integrated and tested. This phase is **visual polish only**: animations and environment props. Do not modify the conversation engine or its APIs.

---

## 0. Ground Rules

- Keep all existing behavior intact:
  - Cooler sessions and SCRUM sessions must still work exactly as before (same routes, same logs, same session formats).
- Limit changes to:
  - Rendering / layout (`drawOffice`, `drawAgent`, zone renderers).
  - Simple animation timing / movement logic (where agents walk/sit).
  - New static assets / props.
- Do **not** change:
  - `server/conversation/*`
  - `server/services/coolerTalkService.ts`
  - SCRUM logic or session formats.
- Use the existing docs for reference:
  - `docs/FINAL_SUMMARY.md`
  - `docs/IMPLEMENTATION_SUMMARY.md`
  - `docs/COOLERSESSION_INTEGRATION_SUMMARY.md`
  - `docs/COOLERSESSION_EXEC_SUMMARY.md`
  - `docs/SESSION_SUMMARY_2026-03-18.md`

This file is a design / checklist doc; actual implementation should be reflected back into the summaries and dev logs once complete.

---

## 1. Animation & Choreography Polish

### 1.1 Cooler Talk (Kitchen)

When a cooler session runs (kitchen):

- **Entry**
  - Agents involved in the session should visibly walk from their desks into the kitchen zone (if they aren’t already there).
  - Use existing zone/position helpers from `layout.ts` / `agentLogic.ts` to determine:
    - The kitchen’s coordinates.
    - Each agent’s "home" position.

- **During conversation**
  - Agents in the kitchen should idle near:
    - Coffee machine.
    - Fridge.
    - Counter/standing area.
  - Simple idle "bobbing" or subtle animation is sufficient.

- **Exit**
  - After cooler talk ends, agents walk back to their home zones/desks.

Behavioral constraints:

- Do not change how the engine chooses participants or how long conversations run.
- Treat animation as a visual layer on top of existing state.

### 1.2 SCRUM (Conference Room / Mission Control)

For SCRUM sessions:

- **Room choice**
  - Use the **Conference Room** as the default SCRUM room.
  - (Optional future extension: support Mission Control for ops-style SCRUMs.)

- **Entry**
  - Relevant agents (usually clerk, specialist, executive, archivist) walk into the Conference Room.
  - Assign fixed chair positions around the conference table; define these in `layout.ts` (e.g. `CONFERENCE_ROOM_POINTS`).

- **Seating**
  - Represent seated state simply:
    - Slightly different sprite offset or pose.
    - Lower Y-position to suggest sitting.

- **Exit**
  - After SCRUM completes, agents return to their desks.

Constraints:

- Keep animation logic deterministic and simple (no random jitter that might complicate tests).
- Do not alter SCRUM stages or APIs—only how agents move and sit in response to SCRUM state.

---

## 2. Environment Props / Office Objects

**Goal:** Make each zone visually distinct and more “lived in” by adding static objects. Keep everything consistent with the remodel plan.

Focus files:

- `src/utils/drawOffice.ts`
- `src/utils/layout.ts`
- Existing "drawX" helpers (e.g. `drawLobby`, `drawArchives`, etc.)

### 2.1 Kitchen & Cooler

Add props:

- **Coffee machine**
  - Simple rectangle with a spout and indicator light on a counter.
- **Coffee mugs**
  - A few small mug shapes on or near the counter.
- **Stocked fridge**
  - Fridge rectangle with handle; color/shading to distinguish it.
- **Snack shelf / cabinet**
  - Small shelving unit with a few colored rectangles representing snacks/cups.

Place within the existing kitchen bounds; don’t change room geometry, only decorate.

### 2.2 Conference Room

Add props:

- **Table objects**
  - Laptops or notepads on the table.
  - A central agenda pad.
- **Walls**
  - Whiteboard with a few colored strokes; or
  - Large screen (if not already present) for SCRUM topics.

Goal: visually differentiate SCRUM scenes from cooler talk.

### 2.3 Archives & Records

Add props:

- Additional **bookshelves** along walls with more color variety.
- A few **stacked boxes** on the floor to emphasize storage/records.

### 2.4 Open Office

Subtle props:

- Extra **monitors** or **paper stacks** on desks.
- A couple of **small plants** (green blobs in pots).

Keep clutter low; hint at activity without overwhelming the scene.

### 2.5 Gym & Wellness

If the Gym zone exists per remodel:

- **Weights** (dumbbells or barbell shapes).
- **Mat** (colored floor rectangle).
- Optional: small **towel rack** with towel shapes.

### 2.6 Mission Control

Enhance the existing Mission Control visuals:

- Additional **screens** with tiny fake graphs/lines.
- A few more **indicator lights** (green/yellow/red), consistent with the existing style.

---

## 3. Zone Indicators & Labels (Small Tweaks)

The current code already has zone labels and BUSY/QUIET indicators with glow effects.

Polish:

- Ensure zone labels and indicators do not overlap with new props.
- Minor spacing/padding adjustments:
  - Labels remain readable.
  - Props don’t visually collide with text.

No changes to behavior or logic—only layout adjustments.

---

## 4. Constraints & Verification Checklist

After making visual/animation changes, verify:

1. **Build & Types**
   - `npm run build` passes.
   - No new TypeScript errors.

2. **Behavioral invariants**
   - Cooler Talk:
     - `/api/rooms/:location/cooler/run-turn` behavior unchanged.
     - Logs and session formats unchanged.
   - SCRUM:
     - `/api/scrum/*` routes behave exactly as before (same JSON, same markdown log format under `data/scrum_logs/`).

3. **Visual sanity checks**
   - Start the app and manually:
     - Trigger a cooler session in the kitchen.
       - Agents move into kitchen, congregate near props, return afterward.
     - Trigger a SCRUM session.
       - Agents walk into Conference Room, sit, then return to desks when done.
     - Confirm props appear in each zone as intended.

4. **Docs alignment**
   - If implementation deviates from this plan or from `visual-polish.md`, update:
     - `docs/dev_logs/VISUAL_POLISH_PHASE.md`
     - `docs/SESSION_SUMMARY_YYYY-MM-DD.md` (for the relevant date)

This document is for humans and tools (e.g. Opencode) to compare against actual changes and see what, if anything, remains for future polish passes.