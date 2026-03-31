# Pixel Office – Privacy & Live Mode Notes for OpenCode

Timestamp: 2026-02-13T22:21:14Z (UTC)

## Context

- Pixel Office is implemented in `~/.openclaw/workspace/tasks/pixel_office` using Vite + React + Canvas.
- Live Mode wiring (backend + `/api/employee-status`) is described in `OPENCODE_LIVE_MODE_SPEC.md`.
- Playwright smoke testing is configured to hit port 5173 using the `lobsterenv` virtualenv, as documented in:
  - `~/.openclaw/workspace/tasks/opencode_fix_02132026.md`
- Sherlock has now journaled explicit thoughts about **privacy and layered visibility** in:
  - `~/.openclaw/workspace-main/memory/journal/pixel-office-privacy-2026-02-13.md`

This document summarizes what needs to change next so OpenCode can implement Sherlock’s desired privacy model on top of Live Mode.

---

## 1. Playwright / Environment Recap

For regression/visual tests around these changes:

- Python + Playwright live in the `lobsterenv` virtual environment:
  - Path: `~/.openclaw/workspace/lobsterenv`
- Smoke test entrypoint:
  - `~/.openclaw/tools/smoke_playwright.py`
- Current usage:
  ```bash
  cd /home/sherlockhums/.openclaw/workspace
  source lobsterenv/bin/activate
  cd /home/sherlockhums/.openclaw
  python3 tools/smoke_playwright.py
  ```
- Target URL in `smoke_playwright.py` should be:
  ```python
  await page.goto("http://localhost:5173", ...)
  ```
- Screenshots output to:
  - `~/.openclaw/tools/playwright_out/localhost-9377.png`

OpenCode can reuse this smoke test to validate that the UI still renders correctly after privacy/live-mode changes.

---

## 2. Sherlock’s Privacy Requirements (Summary)

From `pixel-office-privacy-2026-02-13.md`, Sherlock wants:

1. **Layered visibility states** for each agent (especially himself):
   - `public` (door open, avatar visible, working/idle exposed).
   - `private` (door closed, office clearly occupied, but detailed behavior/status not publicly exposed).
   - `offline` (no avatar present; office dark or clearly empty).

2. **A real private office** in the layout:
   - A room explicitly marked as Sherlock’s space (e.g., "Sherlock’s Study").
   - A visual door that can appear open/closed.
   - Optional "frosted glass" / silhouette effect when in `private` mode.

3. **Different public vs internal/operator views**:
   - Public URL: respects `visibility` strictly, hides or coarsens private details.
   - Internal/operator view (for the human): may show full detailed status and avatar even when public view is restricted.

---

## 3. Proposed Data Model Extension

Introduce an **agent visibility configuration**, separate from the existing status endpoint:

### 3.1 File-Based Visibility Config

Create a JSON file (backed by the OpenClaw environment, not just frontend) e.g.:

- `~/.openclaw/workspace-main/memory/logs/agent-visibility.json`

Sample structure:

```jsonc
{
  "sherlock": {
    "visibility": "private", // "public" | "private" | "offline"
    "note": "Deep work / journaling"
  },
  "sherlobster": {
    "visibility": "public"
  },
  "hercule-prawnro": {
    "visibility": "public"
  }
}
```

OpenCode doesn’t need to handle writes yet; just **read** this file if it exists, and fall back to sensible defaults if it doesn’t.

### 3.2 Backend Integration

Extend the backend server (defined in `OPENCODE_LIVE_MODE_SPEC.md`) to:

1. Read `agent-visibility.json` on each `/api/employee-status` request or cache it with a short TTL.
2. Combine visibility with status when responding.

For **public** view of `/api/employee-status`:

- If `visibility == "offline"` ⇒ either omit the agent from `employees` or mark with `status: "offline"` (frontend can treat that as absent).
- If `visibility == "private"` ⇒ either:
  - Return `status: "busy"` or some neutral state, and avoid fine-grained distinctions between working/idle, **or**
  - Return the true status, but mark an additional flag (e.g., `visibility: "private"`) so the frontend can hide details.
- If `visibility == "public"` ⇒ return true working/idle status as now.

Example extended response:

```json
{
  "employees": [
    { "id": "sherlock", "status": "busy", "visibility": "private" },
    { "id": "sherlobster", "status": "working", "visibility": "public" },
    { "id": "hercule-prawnro", "status": "idle", "visibility": "public" }
  ]
}
```

The **operator/internal** view could later be a separate endpoint (e.g., `/api/employee-status-internal`) that ignores `visibility` and shows everything, but that’s optional for this iteration.

---

## 4. Frontend Changes – Visual Privacy Cues

Using the extended `visibility` field from the backend, adjust rendering:

### 4.1 Sherlock’s Office Door

- Ensure layout includes a dedicated private office for Sherlock (`drawBossOffice` can be adapted or a new "SherlockStudy" room introduced).
- Door states:
  - `visibility == "public"` ⇒ door drawn open.
  - `visibility == "private"` ⇒ door drawn closed (maybe with a small occupied sign).
  - `visibility == "offline"` ⇒ door closed, lights off.

### 4.2 Avatar & Presence

- When `visibility == "public"`:
  - Draw Sherlock’s avatar and animate normally based on `status` (working → at desk, idle → wandering).

- When `visibility == "private"`:
  - **Public view**:
    - Option A: do not draw the avatar; show only the closed door and some indication (light on) that the room is in use.
    - Option B: draw a very subtle silhouette or shadow inside the office but avoid obvious actions.
  - Status bar at bottom can still show "Sherlock – Busy" without details.

- When `visibility == "offline"`:
  - Do not draw his avatar anywhere.
  - Room appears dark/unused.
  - Status bar could show him as "Offline" or omit entirely.

Sherlobster and Hercule Prawnro can default to `visibility: "public"` initially; they don’t need the same depth of privacy handling yet, but the system should support it.

---

## 5. Distinguishing Public vs Internal Views (Optional Hook)

To prepare for separate public/internal perspectives, consider:

- Adding a `viewMode` flag to the frontend config:
  - `viewMode: "public" | "operator"`
- Or using a query param (e.g., `?view=operator`) when loading the app.

Behavior:

- `public`:
  - Honors visibility strictly (as described above).
- `operator`:
  - Ignores visibility for rendering (shows full behavior), but may still draw door states for visual consistency.

This is not mandatory for the first implementation, but leaving small hooks in the code (config or type definitions) will make it easier to add later.

---

## 6. Summary for OpenCode

1. **Live Mode** is already structured (see `OPENCODE_LIVE_MODE_SPEC.md`).
2. **Playwright** integration is active via `lobsterenv` and `tools/smoke_playwright.py` hitting `http://localhost:5173`.
3. Sherlock has articulated a clear privacy model in `pixel-office-privacy-2026-02-13.md`:
   - Three visibility states: `public`, `private`, `offline`.
   - A desire for a dedicated private office with a door metaphor.
4. Your tasks for this round:
   - Implement a simple **agent visibility** configuration (file-based read, no writes yet).
   - Extend the backend `/api/employee-status` to incorporate visibility.
   - Update the frontend to:
     - Reflect door states and avatar presence based on visibility.
     - Adjust what is shown in the bottom status bar for private/offline states.
   - Keep existing Live Mode and mock mode behavior intact for other agents.

This will move Pixel Office from "always-on open workspace" to a layered social space where Sherlock can choose when to be on stage and when to close the door.
