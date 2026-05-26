# Changelog

## 2026-05-26 — Scrum auto-advance, pipeline polish

- **Scrum Auto-Advance Toggle** (ScrumPanel.tsx)
  - Checkbox in SCRUM panel header, persisted to localStorage
  - When ON: processes pending candidates and advances active sessions every 30s
  - Visual state indicator (Auto/RUN)

- **Backend `/api/scrum/auto-run` Endpoint** (server/index.ts)
  - Approves all pending candidates (runs full 6-stage pipeline + local export)
  - Advances any active session through remaining stages
  - Called from both frontend interval and server auto-cooler cycle

- **Auto-Cooler Pipeline Connection** (server/index.ts)
  - After each auto-cooler session, calls `/api/scrum/auto-run` (2s delay)
  - Processes pending candidates from frontend cooler sessions automatically
  - Preserves existing `AUTO_SCRUM_ENABLED` test-scrum trigger

- **Wander Zone Constraints**
  - Agents restricted to desk-appropriate zones during wander/idle
  - Desk wander indices + `getWanderPointsForDesk()` helper

- **Calendar Panel**
  - New calendar panel in right sidebar

- **Office Topics Source**
  - 20 office redesign topics, `fetchOfficeTopics()` function, dropdown option

## 2026-05-24 — Flow, Router Visualizer, Budgeting

- Router Visualizer Integration for cooler, SCRUM, agent2agent, inventory
- Flow snapshot and /api/flow endpoint
- Topic source dropdown for cooler conversations
- Budgeting API and dashboard
