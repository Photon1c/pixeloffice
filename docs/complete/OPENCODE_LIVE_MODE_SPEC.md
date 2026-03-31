# Pixel Office Live Mode – Backend & Integration Spec for OpenCode

This document describes how to add **Live Agent Mode** to the Pixel Office project and wire in the first three agents:
- Sherlock
- Sherlobster
- Hercule Prawnro

The goal is to let the existing Canvas/React Pixel Office reflect **real agent status** instead of mock-random behavior.

Project root:
- `~/.openclaw/workspace/tasks/pixel_office`

Current stack (from existing files):
- Vite + React + TypeScript
- Entry: `src/main.tsx`, `src/App.tsx`
- Core component: `src/components/PixelOffice.tsx`
- Utilities: `src/utils/*`
- Types: `src/types/index.ts`

---

## 1. Current PixelOffice Behavior (Baseline)

From `src/components/PixelOffice.tsx`:

- `PixelOffice` accepts a `config: DashboardConfig` (or partial via props), merged with `DEFAULT_CONFIG`:
  - `pollingInterval: number` (ms) – used when **not** in mock mode.
  - `mockMode: boolean` – when true, randomizes agent statuses on an interval.
  - `mockToggleSpeed: number` – how often to randomize status in mock mode.
  - `showStatusBar`, `showNames`, `animationSpeed`, `theme`, `canvasScale`.

- Status logic:
  - If `dashboardConfig.mockMode === true`:
    - A `setInterval` randomly sets each agent to `"working"` or `"idle"` every `mockToggleSpeed` ms.
  - If `mockMode === false`:
    - A `setInterval` calls `fetchStatus()` every `pollingInterval` ms.
    - `fetchStatus()` does:
      ```ts
      const response = await fetch("/api/employee-status");
      const data = await response.json();
      setAgents(prevAgents =>
        prevAgents.map(agent => {
          const statusUpdate = data.employees.find(e => e.id === agent.id);
          if (statusUpdate) {
            return updateAgentStatus(agent, statusUpdate.status);
          }
          return agent;
        })
      );
      ```

- Rendering:
  - Uses helpers: `drawFloor`, `drawWalls`, `drawConferenceRoom`, `drawBossOffice`, `drawKitchen`, `drawCubicles`, `drawLounge`, `drawPlants`, `drawStatusBar`, `drawAgent`, `drawDeskItem`.
  - Canvas size constants from `utils/layout.ts` (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `COLORS`).

**Key point:** The component is **already designed** to support a real `/api/employee-status` backend when `mockMode` is turned off.

---

## 2. Live Agent Mode Concept

### 2.1 Definition

**Live Agent Mode** means:
- `PixelOffice` shows the **real working/idle state** of:
  - `sherlock`
  - `sherlobster`
  - `hercule-prawnro`
- Data source: a backend endpoint at **`GET /api/employee-status`**.
- UI: a user-facing toggle to flip between:
  - **Mock Mode** (current behavior – random animation), and
  - **Live Mode** (real statuses from backend).

### 2.2 Agent IDs & Mapping

Please use the following IDs in the frontend and backend:

```ts
// src/types/index.ts (already defines Agent etc.)

export type AgentId = "sherlock" | "sherlobster" | "hercule-prawnro";
```

Expected `employees` entries from the backend:

```json
{
  "employees": [
    { "id": "sherlock", "status": "working" },
    { "id": "sherlobster", "status": "idle" },
    { "id": "hercule-prawnro", "status": "working" }
  ]
}
```

Status values must be:
- `"working"` or
- `"idle"`

These map directly to the `AgentStatus` union type already used by the PixelOffice logic.

---

## 3. Backend Script – Recommended Implementation

### 3.1 Requirements

We want a small backend that:

- Serves the built Pixel Office (if needed), and
- Exposes `GET /api/employee-status`.

Because this lives under `~/.openclaw/workspace/tasks/pixel_office`, the backend should be **simple and self-contained**.

Recommended approach:
- Node.js + Express (or a minimal `http` server), TypeScript or JS.
- Run as a separate process (e.g., `npm run dev:server` or `npm run live-server`).

### 3.2 Data Source for Now

For v1 of Live Mode, we can start with a **stubbed logic** that approximates agent states but is easy to extend later:

- Use an in-memory or file-based store representing the latest known state of each agent.
- Later, this can be wired to real OpenClaw state (sessions, heartbeats, active tasks).

Example stub logic:

```ts
// pseudo-code for server-side status

const agents = {
  sherlock: {
    id: "sherlock",
    status: "working" as AgentStatus,
  },
  sherlobster: {
    id: "sherlobster",
    status: "idle" as AgentStatus,
  },
  "hercule-prawnro": {
    id: "hercule-prawnro",
    status: "working" as AgentStatus,
  },
};

app.get("/api/employee-status", (req, res) => {
  // In the future, refresh from real OpenClaw data before responding
  res.json({ employees: Object.values(agents) });
});
```

**Future extension point:**
- Read from a JSON file that OpenClaw updates, e.g.
  - `~/.openclaw/workspace-main/memory/logs/agent-status.json`
- Or call an OpenClaw HTTP endpoint if one is exposed.

For now, please keep it as a stub with a clear structure and a `TODO` comment about wiring to real OpenClaw.

### 3.3 File Layout Proposal

Add a `server` folder in the project root:

```text
pixel_office/
  server/
    index.ts        # or index.js
    types.d.ts      # shared types for AgentStatus, etc. (optional)
```

Example `server/index.ts` (TypeScript, Express):

```ts
import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 4173; // or 3000

// Basic agent status stub
const agents = {
  sherlock: { id: "sherlock", status: "working" as const },
  sherlobster: { id: "sherlobster", status: "idle" as const },
  "hercule-prawnro": { id: "hercule-prawnro", status: "working" as const },
};

app.get("/api/employee-status", (_req, res) => {
  // TODO: Replace stub with real OpenClaw-backed state
  res.json({ employees: Object.values(agents) });
});

// Optionally serve built frontend (dist/) so server is standalone
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Pixel Office Live server running on http://localhost:${PORT}`);
});
```

Add scripts to `package.json`:

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "dev:server": "ts-node server/index.ts",   // or node build output
    "build:server": "tsc -p server/tsconfig.json" // optional if you want a separate TS config
  }
}
```

If you prefer JavaScript:
- Use `index.js` with `require()` and run via `node server/index.js`.

---

## 4. Frontend Changes for Live Mode

### 4.1 Dashboard Toggle

Add an explicit **Live Agent Mode** toggle to the `Dashboard` UI in `PixelOffice.tsx`.

Current UI controls include:
- Mock Mode checkbox
- Mock Toggle Speed slider
- Show Status Bar
- Show Agent Names
- Animation Speed
- Canvas Scale

**Change:**
- Add a new boolean in `DashboardConfig`:
  - `liveMode: boolean` (default `false`).
- In `DEFAULT_CONFIG`:

```ts
const DEFAULT_CONFIG: DashboardConfig = {
  pollingInterval: 5000,
  mockMode: true,
  mockToggleSpeed: 5000,
  showStatusBar: true,
  showNames: true,
  animationSpeed: 2,
  theme: "dark",
  canvasScale: 1,
  liveMode: false,
};
```

- Add to `DashboardConfig` type in `src/types/index.ts`.

- In `Dashboard` component, add a new section:

```tsx
<div style={styles.dashboardSection}>
  <label style={styles.label}>
    <input
      type="checkbox"
      checked={config.liveMode}
      onChange={(e) =>
        onUpdate({
          liveMode: e.target.checked,
          mockMode: !e.target.checked, // keep invariant: liveMode implies !mockMode
        })
      }
      style={styles.checkbox}
    />
    Live Agent Mode (use /api/employee-status)
  </label>
</div>
```

### 4.2 Polling Logic Adjustment

Right now, polling logic is keyed solely on `mockMode`:

```ts
useEffect(() => {
  if (!dashboardConfig.mockMode) {
    const interval = setInterval(fetchStatus, dashboardConfig.pollingInterval);
    return () => clearInterval(interval);
  } else {
    // mock mode interval...
  }
}, [dashboardConfig.mockMode, dashboardConfig.pollingInterval, dashboardConfig.mockToggleSpeed, fetchStatus]);
``>

**Adjust to use `liveMode`** as the primary branch:

- Define the invariant: 
  - When `liveMode === true` → `mockMode` should be treated as **false**.
  - When `liveMode === false && mockMode === true` → use mock toggling.

One possible structure:

```ts
useEffect(() => {
  if (dashboardConfig.liveMode) {
    const interval = setInterval(fetchStatus, dashboardConfig.pollingInterval);
    return () => clearInterval(interval);
  }

  if (dashboardConfig.mockMode) {
    const interval = setInterval(() => {
      setAgents(prevAgents =>
        prevAgents.map(agent => {
          const newStatus: AgentStatus = Math.random() > 0.3 ? "working" : "idle";
          return updateAgentStatus(agent, newStatus);
        })
      );
    }, dashboardConfig.mockToggleSpeed);
    return () => clearInterval(interval);
  }

  // If neither liveMode nor mockMode, do nothing (agents hold their last known state)
  return;
}, [dashboardConfig.liveMode, dashboardConfig.mockMode, dashboardConfig.pollingInterval, dashboardConfig.mockToggleSpeed, fetchStatus]);
```

### 4.3 Default Behavior

- When app loads:
  - `liveMode = false`
  - `mockMode = true`
  - Behavior remains exactly as it does today (fun random animation).
- When user flips **Live Agent Mode ON**:
  - `liveMode = true`
  - `mockMode = false`
  - PixelOffice begins polling `/api/employee-status` every `pollingInterval` ms.

If the backend is not running or returns an error, `fetchStatus` already logs a console error. That behavior is acceptable for v1.

---

## 5. Sherlock / Sherlobster / Hercule Prawnro – Agent Wiring

### 5.1 Agent List in Frontend

Ensure `INITIAL_AGENTS` (from `utils/agentLogic.ts`) includes exactly these three with stable IDs:

```ts
export const INITIAL_AGENTS: Agent[] = [
  {
    id: "sherlock",
    name: "Sherlock",
    color: "#4ecdc4", // example
    role: "researcher",
    status: "idle",
    // x, y, targetX, targetY, dir, frame, mode assigned appropriately
  },
  {
    id: "sherlobster",
    name: "Sherlobster",
    color: "#ff6b6b",
    role: "scout",
    status: "idle",
  },
  {
    id: "hercule-prawnro",
    name: "Hercule Prawnro",
    color: "#feca57",
    role: "qa",
    status: "idle",
  },
];
```

The exact layout coordinates are already handled in `agentLogic` / `layout` – no changes required there, as long as IDs remain stable.

### 5.2 Backend-to-Frontend Agreement

- Backend must send exactly those IDs in `employees` array.
- Frontend will ignore unknown IDs and leave any unmatched agent statuses unchanged.

Example live response when Sherlock is working, others idle:

```json
{
  "employees": [
    { "id": "sherlock", "status": "working" },
    { "id": "sherlobster", "status": "idle" },
    { "id": "hercule-prawnro", "status": "idle" }
  ]
}
```

---

## 6. How to Run in Live Mode (Developer Workflow)

After implementation, expected dev workflow:

1. **Frontend dev (as today):**
   ```bash
   npm install
   npm run dev
   ```
   - Runs Vite dev server.

2. **Backend dev:**
   ```bash
   npm run dev:server
   ```
   - Runs Express/Node server exposing `/api/employee-status`.

3. **Configure dev proxy (optional but recommended):**

   In `vite.config.ts`, add a proxy so frontend dev server forwards `/api/employee-status` to the backend:

   ```ts
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";

   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         "/api": {
           target: "http://localhost:4173", // or whichever port backend uses
           changeOrigin: true,
         },
       },
     },
   });
   ```

   This way, the React app can always `fetch("/api/employee-status")` without worrying about ports.

4. Use the **Parameters Dashboard** in the UI to:
   - Turn **Live Agent Mode** ON.
   - Confirm that statuses now follow backend stub instead of random behavior.

---

## 7. Future Hooks for Real OpenClaw Integration (Notes Only)

This is out of scope for this ticket, but important to keep in mind:

- Eventually, the backend should read a real status file or endpoint, e.g.:
  - `~/.openclaw/workspace-main/memory/logs/agent-status.json`
  - Or an internal OpenClaw HTTP API.
- The format of that real status data should be mapped into the simple `employees[{id, status}]` structure used by PixelOffice.
- When that is in place, toggling **Live Agent Mode** will reflect actual agent activity instead of hardcoded/stub states.

For now, this spec asks OpenCode to:
1. Implement the **backend stub** for `/api/employee-status`.
2. Wire up the **Live Agent Mode** toggle and polling logic in the frontend.
3. Ensure Sherlock, Sherlobster, and Hercule Prawnro are correctly represented as agents whose status comes from that endpoint when live mode is enabled.

This should provide a clean, extensible baseline for future deeper integration with OpenClaw.
