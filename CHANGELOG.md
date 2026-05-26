# Changelog

## 2026-05-26 — Topic diversity, auto-cooler candidate generation

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

- **Server-Side Auto-Run Scheduler** (server/index.ts)
  - Background interval (default 3min, 45s in night mode) calls `/api/scrum/auto-run`
  - Auto-starts 5s after server boot — no panel or toggle required
  - Respects night mode (4x faster when sleep mode is active)
  - Start/stop/status endpoints at `/api/scrum/auto-run/start|stop|status`
  - Configurable via `AUTO_RUN_INTERVAL_MS` env var

- **Wander Zone Constraints**
  - Agents restricted to desk-appropriate zones during wander/idle
  - Desk wander indices + `getWanderPointsForDesk()` helper

- **Calendar Panel**
  - New calendar panel in right sidebar

- **Office Topics Source**
  - 20 office redesign topics, `fetchOfficeTopics()` function, dropdown option

- **Topic Diversity for SCRUM Candidates** (server/services/newsTopics.ts)
  - `fetchNewsTopics("auto")` now fetches from GitHub AND news sources in parallel, merging results for topic diversity
  - Recent topic tracking prevents repeating the same topic within 8 consecutive picks
  - No more all-candidates-being-about-the-latest-git-commit

- **Auto-Cooler → SCRUM Candidate Pipeline** (server/index.ts)
  - Auto-cooler sessions now generate SCRUM candidates via `maybeCreateScrumCandidate()`
  - Candidates trigger auto-approval + pipeline (2s delay) for fully autonomous scrumming
  - Previously: auto-cooler only auto-approved frontend-generated candidates
  - Now: each auto-cooler session can produce its own candidate

## 2026-05-24 — Flow, Router Visualizer, Budgeting

- Router Visualizer Integration for cooler, SCRUM, agent2agent, inventory
- Flow snapshot and /api/flow endpoint
- Topic source dropdown for cooler conversations
- Budgeting API and dashboard
