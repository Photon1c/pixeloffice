# Pixel Office OpenCode Documentation Index

This index tracks the implementation status of various OpenCode-related features and proposals in the Pixel Office environment.

## 📋 Specifications & Proposals

### Agent Workspace Editor
- [x] **Agent Workspace Editor** - GUI for agent proposals and reviews (now in `/active/`)
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

## 📝 Notes

- Specifications marked with `[ ]` indicate pending implementation work
- Specifications marked with `[x]` indicate completed work
- Check individual documents in `/complete/` and `/design/` directories for details
- Some features may be intentionally deferred or designed for future phases

*Last Updated: April 5, 2026*