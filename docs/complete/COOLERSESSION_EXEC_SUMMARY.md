# Pixel Office Remodel + CoolerSession – Executive Summary

**Date:** 2026‑03‑18  
**Status:** Remodel + CoolerSession integration complete and verified

## What Changed Overall

Pixel Office is now a coherent, living office organism:

- The **map** has been remodeled into distinct, named zones.
- Every **agent** has a home that actually matches their role.
- A **location‑aware conversation engine** (CoolerSession) now runs inside the app.
- Conversations **persist per zone**, survive restarts, and can be exported.
- The UI shows **zone activity** visually: where people are, who’s talking, and how “busy” each area feels.

Think: not just “sprites on a canvas,” but a campus where space, roles, and conversations line up.

---

## Phase 1 – Remodel: Space and Roles

The office layout was re‑architected to match how you think about the team:

- **Zones defined** in layout logic:
  - Executive Suite – LeslieClaw
  - Specialist Suites – Zeroclaw, Sherlobster, Hercule Prawnro
  - Conference Room – SCRUM/meetings
  - Kitchen & Cooler – casual talk
  - Lobby & Reception – FrontDesk
  - Archives & Records – Hermitclaw
  - Open Office – Openclaw + Ironclaw
  - Mission Control – ground‑station style monitoring

- **Agents placed** according to role:
  - Receptionist in Lobby, Archivist in Archives, Executive in Executive Suite, etc.

- **Rendering upgraded**:
  - Rooms are drawn from a zone config (not hardcoded rectangles).
  - Each zone has its own furniture (reception desk, shelves, specialist dividers, gym equipment, Mission Control consoles).
  - Agents have **role colors** (e.g., executive red, clerk blue, custodian teal).

Effect: when you look at the office, you’re seeing *who* is where, not just pixels.

---

## Phase 2 – Zone Activity & Mood

The office now tracks what each zone is “feeling” and doing:

- **Zone activity tracking**:
  - `ZONE_CONFIG` configures mood, intensity, and color per zone.
  - `getZoneAtPosition()` maps agent coordinates → zone.
  - Zone activity is updated on a timer (every ~2s).

- **Visual indicators**:
  - Glowing/pulsing overlay when a zone has an active conversation.
  - “BUSY” vs “QUIET” labels based on agent count and status.
  - Agent count badges per zone.

- **Location‑aware mood & thoughts**:
  - Kitchen: happy/excited, “Coffee break!” style thoughts.
  - Executive: thinking/neutral, “Strategic planning…” type inner monologue.
  - Archives: reflective, “Looking back…” vibes.
  - Mission Control: “All systems go!” telemetry energy.

Effect: you see not just layout, but *where the energy is* and how each room is behaving.

---

## Phase 3 – CoolerSession Engine Integration

The conversation engine from the temporary shuttle is now fully embedded in Pixel Office:

- **Engine copied in** under `server/conversation/`:
  - `api.ts`, `coolerController.ts`, `config.ts`, `persistence/serialize.ts`, `types.ts`, prompts/repair/validation/tests.
  - Behavior matches the handoff spec exactly.

- **LLM wiring**:
  - New `src/llm/client.ts` wraps OpenAI (uses `OPENAI_API_KEY`).
  - `server/services/llmGenerateFn.ts` implements the `GenerateFn` the engine expects.

- **Service layer**:
  - `server/services/coolerTalkService.ts`:
    - Loads/creates sessions per location.
    - Runs turns via `runNextTurn(session, generateFn)`.
    - Persists to `data/cooler_sessions/<location>.json`.
    - Provides export (markdown + JSON).

- **HTTP API**:
  - `POST /api/rooms/:location/cooler/run-turn`
    - Used by the client to fire a conversation turn in a specific room.
  - `GET /api/rooms/:location/cooler/export`
    - Returns full markdown + JSON for that room’s conversation.

- **UI integration**:
  - Cooler Talk button in `PixelOffice.tsx` now calls:
    - `/api/rooms/kitchen/cooler/run-turn` (for kitchen cooler talk) with all 8 agents as participants.
  - Agents physically move to the kitchen, talk, display bubbles, then return to their desks.
  - Zone indicator glows while they’re talking; activity labels update.

Effect: each zone now has its own **durable, location‑aware conversation**, driven by a single, well‑tested engine.

---

## Verification & Safety Nets

All three implementation docs agree on the verification story:

- Builds and TypeScript checks:
  - `npm run build` passes.
  - No TS errors.
- Runtime:
  - `npm run dev:server` starts cleanly.
  - API calls for run‑turn + export work and return the right shapes.
  - JSON session files in `data/cooler_sessions/` are created and used after restarts.
  - `location` is correctly populated in session objects and exports.
- Tests:
  - New scripts added:
    - `"test:cooler": "tsx server/conversation/tests/index.ts"`
    - `"test:cooler:run": "tsx server/conversation/tests/run.ts"`

Effect: this isn’t a one‑off hack; it’s wired into tests, scripts, and a service layer, with clear places to inspect and debug.

---

## What This Means for You

When you open Pixel Office now:

- You’re seeing:
  - Agents in **meaningful rooms**.
  - Real‑time **zone activity** and mood.
  - A kitchen/lobby/etc. that can carry and remember conversations over time.

If you want to know “what’s on the office’s mind”:

- Look at:
  - Which zones are pulsing/busy.
  - The cooler talk in the relevant room.
  - The exported markdown / session JSON if you want a deeper read.

This sets you up for:

- Future SCRUM / planning rituals that sit on *top* of a solid conversation substrate.
- Long‑term memory of how each room has been thinking and feeling, instead of ephemeral chat.
