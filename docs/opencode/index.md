# Pixel Office OpenCode Documentation Index

This index tracks the implementation status of various OpenCode-related features and proposals in the Pixel Office environment.

## 📋 Specifications & Proposals

### Agent Workspace Editor
- [x] **Agent Workspace Editor** - GUI for agent proposals and reviews (now in `/complete/`)
  - Status: Implemented as ObjectEditor.tsx + enhanced for agent self-editing capabilities

### Reliability Workflows
- [x] **Reliability Workflows Spec** - Mapping test hooks and smoke tests (now in `/complete/`)
  - Status: Spec complete - light implementation implemented (smoke tests created)

### Stigmergy Next Steps
- [x] **Stigmergy Next Steps** - Incremental improvements to stigmergy system (now in `/complete/`)
  - Status: Building on existing implementation - incremental updates completed

### NVIDIA Integration
- [x] **NVIDIA Integration Spec** - Future hook for NVIDIA model support (now in `/complete/`)
  - Status: Implementation completed (client adapter and router created with z-ai/glm4.7 as default model)

### Grok Suggestions
- [x] **Grok Suggestions** - Enhancements for agent delegation and visibility (now in `/complete/`)
  - Status: Delegation detection and office status panel implemented

### Cursor/Opencode Workflow
- [x] **Cursor/Opencode Workflow** - Established conventions for agent work (now in `/complete/`)
  - Status: Implemented and followed

### Code Audit Workflow
- [x] **Code Audit Workflow** - OpenCode audit workflow with Prompt Card schema and CLI tool
  - Status: **Complete** - All components implemented and tested
  - Components:
    - Prompt Card schema: `~/.openclaw/workspace-main/docs/opencode/schema.md`
    - CLI interface: `~/tools/opencode_audit/opencode_audit.py`
    - Pixel Office API: `/api/audit/create`, `/api/audit/:id`, `/api/audit`
    - Router visualizer: `code-audit` workflow added to dropdown

### Prometheus Metrics Integration
- [x] **Metrics Endpoint** - Prometheus `/metrics` endpoint for observability
  - Status: **Complete** - Phase 1 metrics implemented
  - Components:
    - Library: `prom-client` added to package.json
    - Endpoint: `GET /metrics` on port 4173
    - Metrics: HTTP requests, LLM requests, service uptime

### TSA Health Panel (UI)
- [x] **TSA Health Panel** - In-UI health HUD polling workflow/model/handoff endpoints
  - Code: `src/components/TSAHealthPanel.tsx` (mounted in `src/components/PixelOffice.tsx`)
- [ ] **Positioning polish** - stack HUD overlays and remove hard-coded `top` offsets
  - Handoff: `../active/opencode_pixel_office_tsa_health_ui_handoff.md`

### Agent Tools & Workflow Integration
- [x] **Agent Tools** - Tools for KB search, scheduling, and improvement
  - Status: **Complete** - Tools implemented in roleModels.ts
  - Components:
    - `search_knowledge_base` - Query KB
    - `read_file` - Read local files
    - `schedule_scrum` - Schedule improvement sessions
    - `add_calendar_deadline` - Set deadlines
    - `create_improvement_ticket` - Create backlog items

- [x] **Calendar System** - Time-based task management
  - Status: **Complete** - Endpoints: `/api/calendar/scrum`, `/api/calendar/deadline`, `/api/calendar/ticket`
  - Supports natural language deadlines: "in 2 hours", "tomorrow", "next week"

- [x] **KB Integration** - Knowledge base search + ingest
  - Status: **Complete** - KB server `/ingest` endpoint + Pixel Office endpoints

- [x] **Local Model Configuration** - gemma3:270m for quick transitions
  - Status: **Complete** - Updated `model_role_mapping.json`
  - Components:
    - `gemma3:270m` for handoff/thought_loop roles (quick transitions)
    - `stepfun-ai/step-3.5-flash` for executive decisions (NVIDIA)
    - `getQuickTransitionModel()`, `getExecutiveModel()` in roleModels.ts

- [x] **Cooler → SCRUM Auto-Promotion** - Yellow autonomy workflow
  - Status: **Complete** - Implemented in `server/cooler/coolerToScrum.ts`
  - Scores sessions (threshold 20), marks `is_scrum_candidate`, creates scrum_run (status: pending)
  - Requires human approval (Yellow zone)
- [ ] **Cooler → SCRUM Meaningful Reports** - ensure approvals produce completed SCRUMs + exported reports with at least one suggestion (even “no action”)
  - Handoff: `../active/opencode_cooler_to_scrum_meaningful_reports_handoff.md`

- [x] **Stigmergy Visualization** - Prometheus metrics for office heat
  - Status: **Complete** - Metrics at `/metrics`
  - Types: loopHeat, reviewHeat, speechActivity, taskShadow, observerAttention

- [x] **Autonomy Zones** - GREEN/YELLOW/RED annotations
  - Status: **Complete** - Added to `roleModels.ts`
  - GREEN: auto (search_knowledge_base, read_file)
  - YELLOW: propose/approve (schedule_scrum, create_improvement_ticket)
  - RED: human only (write_code, migrate_db)

## 📝 Notes

- Specifications marked with `[ ]` indicate pending implementation work
- Specifications marked with `[x]` indicate completed work
- Check individual documents in `/complete/` and `/design/` directories for details
- Some features may be intentionally deferred or designed for future phases

*Last Updated: May 25, 2026*
