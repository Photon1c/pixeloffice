# OpenCode Handoff: Pixel Office UI “Thought / Speech / Action” Health Panel (no Grafana)

Date: 2026-04-21

## Context
Leslie wants a **Pixel Office UI-only** health indicator that confirms the “thought / speech / action” loop is alive across agents.
- Grafana is currently rate-limited/unavailable (free tier limit), so **do not require Grafana dashboards**.
- Keep this as **light maintenance**, minimal new infrastructure.

## Goal (what to build)
Add a small **overlay panel** in Pixel Office UI that shows:
1) **System health** (backend workflow system reachable)
2) **Model health** (Ollama reachable, models visible)
3) **Agent health** (per-agent local model readiness + last-updated freshness)
4) Optional: **stigmergy signals** (loop/speech/task indicators) if it’s already easy to surface

The panel should make it obvious when things are “working” vs “degraded” without opening Grafana.

## Existing building blocks (already in repo)
### 1) Handoff JSON endpoint (agent + model status)
Pixel Office server already serves a stable JSON handoff endpoint:
- `GET /handoff/opencode-local-agents.json`

Implementation:
- `~/apps/pixelworld/pixel_office/server/index.ts` (search for `Serve handoff JSON file`)
- It prefers: `~/apps/pixelworld/.handoff/opencode-local-agents.json`
- Falls back to: `~/apps/pixelworld/pixel_office/public/handoff/opencode-local-agents.json`

### 2) Handoff generator (updates `~/apps/pixelworld/.handoff/...`)
There is a real generator script that resolves model status (Ollama `/api/tags`):
- `~/apps/pixelworld/tools/opencode-handoff.mjs`
- Output: `~/apps/pixelworld/.handoff/opencode-local-agents.json`

### 3) Model health JSON endpoint
Pixel Office server already exposes:
- `GET /api/models/health`

Implementation:
- `~/apps/pixelworld/pixel_office/server/index.ts` (search for `Model Health Dashboard Endpoint`)
- Currently lists models and marks them `online` if `GET http://localhost:11434/api/tags` succeeds.

### 4) Workflow health JSON endpoint
Pixel Office server already exposes:
- `GET /api/workflow/health`

### 5) Desk stigmergy JSON endpoints (optional for TSA signals)
Pixel Office server already exposes desk stigmergy state:
- `GET /api/stigmergy/desk/:deskId`

Fields include (useful proxies for TSA):
- `loopHeat` (thought loop / stall signal)
- `speechActivity` (speech/externalization signal)
- `taskShadow` / `reviewHeat` (unfinished work / uncertainty signal)

### 6) UI patterns for overlays
There is already an overlay component for UI perf stability:
- `~/apps/pixelworld/pixel_office/src/components/StabilityMonitor.tsx`

This is a good style/reference for a top-right “health HUD”.

## What OpenCode should implement (recommended minimal scope)
### A) Create a new UI component
Create:
- `~/apps/pixelworld/pixel_office/src/components/TSAHealthPanel.tsx`

Behavior:
- Poll JSON endpoints on an interval (start with 10–30s):
  - `/api/workflow/health`
  - `/api/models/health`
  - `/handoff/opencode-local-agents.json`
- Render a compact status view:
  - Overall: `WORKFLOWS: OK/DEGRADED`, `OLLAMA: OK/DEGRADED`, `AGENTS: X local-ready / Y total`
  - Per-agent list: `agent name`, `primary model`, `status local-ready/local-unavailable/remote`, `updatedAt` age
- Handle failures gracefully (no hard crashes if one endpoint fails).

### B) Mount it inside Pixel Office
Add the panel to the main office UI so it’s always visible:
- Likely mounting point: `~/apps/pixelworld/pixel_office/src/components/PixelOffice.tsx`
- Place it near/under the existing `StabilityMonitor` overlay.

### C) Optional, if quick: show stigmergy “T/S/A” dots
If easy to thread through desk IDs:
- For each agent/desk, show 3 tiny indicators:
  - **T (Thought)**: green if `loopHeat` low, yellow/red if high
  - **S (Speech)**: green if `speechActivity` recently nonzero (or just show current value)
  - **A (Action)**: green if workflow health OK and `taskShadow` not elevated

If this turns into a rabbit hole, skip it for now. The core win is surfacing model + workflow + agent readiness.

## Acceptance criteria
- Panel is visible in Pixel Office UI.
- Panel loads successfully even when:
  - Ollama is down
  - handoff JSON is missing (shows a friendly “handoff missing” state)
- Panel makes it easy to tell:
  - “Ollama reachable”
  - “workflow system healthy”
  - “which agents have local-ready models”
- No new daemon required.

## Follow-up (UI positioning polish)
If the TSA panel overlaps other overlays, fix by stacking the HUD elements instead of hard-coding `top` offsets.

Current mount point:
- `pixel_office/src/components/PixelOffice.tsx` renders:
  - `<StabilityMonitor ... />`
  - `<TSAHealthPanel ... />`

Current TSA absolute positioning:
- `pixel_office/src/components/TSAHealthPanel.tsx` uses `position: 'absolute', top: 80, right: 10`.

Recommended fix (minimal):
- Create a single top-right HUD container (absolute/fixed) with `display:flex; flex-direction:column; gap:10px; align-items:flex-end;` and render both overlays inside it.
- Update overlays to use `position: 'relative'` within the stack (or accept a `style`/`offset` prop) so layout is controlled in one place.

## Operator notes (manual refresh)
If Leslie updates local models and wants to refresh the handoff statuses:
```bash
cd ~/apps/pixelworld
node tools/opencode-handoff.mjs
```
Then Pixel Office UI (via `/handoff/opencode-local-agents.json`) should reflect the updated `.handoff` output.

## Handy code pointers
- Server endpoints: `~/apps/pixelworld/pixel_office/server/index.ts`
  - `/handoff/opencode-local-agents.json`
  - `/api/models/health`
  - `/api/workflow/health`
  - `/api/stigmergy/desk/:deskId`
- UI overlay style: `~/apps/pixelworld/pixel_office/src/components/StabilityMonitor.tsx`
- Main UI: `~/apps/pixelworld/pixel_office/src/components/PixelOffice.tsx`

---

## Implementation Summary (2026-04-21)

### What was built

Created `TSAHealthPanel.tsx` — a compact health overlay panel that polls three JSON endpoints every 15 seconds:

1. `/api/workflow/health` — workflow system reachability
2. `/api/models/health` — Ollama model availability  
3. `/handoff/opencode-local-agents.json` — per-agent model readiness

### Features

- **Overall status indicator**: HEALTHY / DEGRADED / CRITICAL (color-coded: green/yellow/red)
- **Workflow status**: Shows "healthy", "degraded", "down", or "UNREACHABLE"
- **Ollama status**: Shows model count (e.g., "3 online") or error state
- **Agent summary**: Shows X/Y local-ready (e.g., "8/28 local")
- **Agent list** (expandable): Shows up to 8 agents with status badges:
  - `LOCAL` — primary model local-ready
  - `LOCAL-DN` — primary model unavailable locally
  - `REMOTE` — using fallback remote model
- **Error handling**: Gracefully degrades when endpoints fail (no crashes)
- **Minimizeable**: Double-click to collapse to small dot, click to expand

### Files modified

- **Created**: `pixel_office/src/components/TSAHealthPanel.tsx`
- **Modified**: `pixel_office/src/components/PixelOffice.tsx`
  - Added import: `import { TSAHealthPanel } from "./TSAHealthPanel";`
  - Mounted at line 1186, below StabilityMonitor

### Usage

The TSA panel is visible by default in the top-right corner of Pixel Office UI. It provides at-a-glance confirmation that:
- The workflow system is reachable
- Ollama is serving models
- Which agents have local-ready models available

No additional configuration or daemon required. Simply open Pixel Office and look for the "T/S/A" indicator in the top-right.
