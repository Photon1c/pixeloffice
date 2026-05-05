# docs/complete Feature & Implementation Index

This index tracks historical implementations, feature-level completion status, and past upgrades.

## Status Key
- 🟢 **Verified & Core** - Feature is fully implemented and remains a core part of the app.
- 🟡 **Legacy / Needs Review** - Feature was implemented but may have been superseded or needs verification.
- 🔴 **Archived / Deprecated** - Historical documentation or features no longer in active use.
- 🔍 **Human Review Requested** - Opencode could not definitively verify current status in code.

---

## 🟢 Core Infrastructure & Engine
- [x] **Vite + React Canvas Engine** 🟢  
  *Refs:* [PHASE2_SUMMARY_AND_DEV_GUIDE.md](./PHASE2_SUMMARY_AND_DEV_GUIDE.md), [first_pixel_office_implementation_plan.md](./first_pixel_office_implementation_plan.md)
- [x] **Multi-Agent Simulation (Pathfinding & Wander)** 🟢  
  *Refs:* [IMPLEMENTATION_SUMMARY-REMODEL.md](./IMPLEMENTATION_SUMMARY-REMODEL.md), [agent_positions_grid.md](./agent_positions_grid.md)
- [x] **Persistence Layer (File-based JSON)** 🟢  
  *Refs:* [INTEGRATION_LOG_pixel_memory.md](./INTEGRATION_LOG_pixel_memory.md)

## 🟢 Interactive Features & Workflows
- [x] **Cooler Talk System (v2)** 🟢  
  *Refs:* [COOLER_TALK_FEATURE.md](./COOLER_TALK_FEATURE.md), [COOLER_SESSION_AND_REMODEL_FINAL_SUMMARY.md](./COOLER_SESSION_AND_REMODEL_FINAL_SUMMARY.md)
- [x] **SCRUM Integration Pipeline** 🟢  
  *Refs:* [SCRUM_PHASE3A.md](./SCRUM_PHASE3A.md), [scrum_phase_b.md](./scrum_phase_b.md)
- [x] **GitHub Readme Workflow** 🟢  
  *Refs:* [PHASE_C_GITHUB_INTEGRATION.md](./PHASE_C_GITHUB_INTEGRATION.md), [scrum_phase_c_safe_github_integration.md](./scrum_phase_c_safe_github_integration.md)
- [x] **Local Model Support & Fallbacks** 🟢  
  *Refs:* [LOCAL_MODEL_FALLBACK.md](./LOCAL_MODEL_FALLBACK.md), [IMPLEMENTATION_SUMMARY-LOCALMODELS.md](./IMPLEMENTATION_SUMMARY-LOCALMODELS.md)

## 🟢 Stigmergy & Behavioral Fields (April 2026)
- [x] **Stigmergy-Driven Task Selection** 🟢  
  *Refs:* [grok_suggestions_impl.md](./grok_suggestions_impl.md) - Agents weighted by Task Shadow intensity
- [x] **"Delegate to Office" Command** 🟢  
  *Refs:* [grok_suggestions_impl.md](./grok_suggestions_impl.md) - Chat-based delegation → SCRUM creation
- [x] **Office Status Panel** 🟢  
  *Refs:* [grok_suggestions_impl.md](./grok_suggestions_impl.md) - Lab Mode panel with task shadows & social activity
- [x] **Sleep Mode** 🟢  
  *Refs:* [grok_suggestions_impl.md](./grok_suggestions_impl.md) - Reduces agent movement & thought bubbles
- [x] **GitHub Workflow Visualization** 🟢  
  *Refs:* [grok_suggestions_impl.md](./grok_suggestions_impl.md) - 4-step pipeline animation on FrontDesk card
- [x] **Cursor/Opencode Workflow** 🟢  
  *Refs:* [cursor_workflow.md](./cursor_workflow.md) - Established conventions for agent work
- [x] **Reliability Workflows Spec** 🟢  
  *Refs:* [reliability_workflows_spec.md](./reliability_workflows_spec.md) - Mapping test hooks and smoke tests
- [x] **Stigmergy Next Steps** 🟢  
  *Refs:* [stigmergy_next_steps.md](./stigmergy_next_steps.md) - Incremental improvements to stigmergy system
- [x] **Stigmergy Implementation** 🟢  
  *Refs:* [stigmergy_implementation.md](./stigmergy_implementation.md) - Working prototype with Review Heat
- [x] **NVIDIA Integration Spec** 🟢  
  *Refs:* [opencode_nvidia_integration_spec.md](./opencode_nvidia_integration_spec.md) - NVIDIA model integration with adapter and routing (now using z-ai/glm4.7 as default model)
- [x] **Flywheel System** 🟢  
  *Refs:* [flywheel_design.md](./flywheel_design.md) - Python MVP for residue capture, review heat, and promotion engine
- [x] **OpenCode Audit Workflow** 🟢  
  *Refs:* [opencode_cooler_to_scrum_bridge.md](./opencode_cooler_to_scrum_bridge.md) - Full implementation: schema, CLI tool, Pixel Office API, router-visualizer integration
- [x] **Agent Workspace Editor** 🟢  
  *Refs:* [src/components/ObjectEditor.tsx](./src/components/ObjectEditor.tsx), [agent_workspace_editor_proposal.md](./agent_workspace_editor_proposal.md) - GUI for agent self-editing and proposal creation
- [x] **Prometheus/Grafana Metrics Integration (April 8, 2026)** 🟢  
  *Refs:* [session_summary_apple.md](./session_summary_apple.md) - Added stigmergy deposit counter, cooler run-turn counter, loop detection gauge
- [x] **TSA Health HUD (UI overlay)** 🟢  
  *Refs:* [../active/opencode_pixel_office_tsa_health_ui_handoff.md](../active/opencode_pixel_office_tsa_health_ui_handoff.md) - In-UI health panel polling workflow/model/handoff endpoints
- [x] **Ghost Executive Role** 🟢  
  *Refs:* [ghost_executive.md](./ghost_executive.md) - User role concept for stigmergy-based system
- [x] **Onboarding Models Reference** 🟢  
  *Refs:* [onboarding_models.md](./onboarding_models.md) - Model configuration reference

## 🟡 Specialized Labs & Dashboards
- [x] **Genealogy Lab** 🟢  
  *Refs:* [GENEALOGY_LAB.md](./GENEALOGY_LAB.md)
- [x] **Stock Forecast Cockpit** 🟡 (Human Review: Verify data feeds) 🔍  
  *Refs:* [2026-02-20_stock_forecast_cockpit.md](./2026-02-20_stock_forecast_cockpit.md)
- [x] **Admin Assistant / Cockpit** 🟢  
  *Refs:* [ONECODE_HANDOFF_assistant_cockpit.md](./ONECODE_HANDOFF_assistant_cockpit.md), [ADMIN_COCKPIT_404_FIX.md](./ADMIN_COCKPIT_404_FIX.md)
- [x] **Time & Tasks Management** 🟢  
  *Refs:* [time_tasks_v1.md](./time_tasks_v1.md), [time_tasks_ui_checklist.md](./time_tasks_ui_checklist.md)

## 🟢 Visual Polish & Remodels
- [x] **Interior Redesign (v1.1)** 🟢  
  *Refs:* [interior_redesign.md](./interior_redesign.md), [refined_layout_2026-03-22.md](./refined_layout_2026-03-22.md)
- [x] **Grid Layout System** 🟢  
  *Refs:* [grid_layout_2026-03-22.md](./grid_layout_2026-03-22.md)
- [x] **Pixel 3D / Isometric Hints** 🟡 (Superseded by 2D Top-down) 🔴  
  *Refs:* [pixel_3d.md](./pixel_3d.md)

## 🟢 Security & Maintenance
- [x] **Privacy Patch (Live Mode Guard)** 🟢  
  *Refs:* [PRIVACY_PATCH_SUMMARY.md](./PRIVACY_PATCH_SUMMARY.md), [OPENCODE_PRIVACY_LIVE_MODE_NOTES.md](./OPENCODE_PRIVACY_LIVE_MODE_NOTES.md)
- [x] **Governance & Deployment** 🟢  
  *Refs:* [PHASE_D_GOVERNANCE_RELAXATION.md](./PHASE_D_GOVERNANCE_RELAXATION.md), [deploy_spec_netlify_supabase.md](./deploy_spec_netlify_supabase.md)
- [x] **Browser Console Maintenance** 🟢  
  *Refs:* [BROWSER_CONSOLE_FIXES.md](./BROWSER_CONSOLE_FIXES.md), [debug-318.md](./debug-318.md)

## 🔴 Archived (Historical Reference)
- [x] **Bug Reports (March 2026)** 🔴  
  *Refs:* [curr_bugs.md](./curr_bugs.md), [night_bugs.md](./night_bugs.md), [live_app_error_report_2026-03.md](./live_app_error_report_2026-03.md)
- [x] **Netlify Deployment Issues (March 2026)** 🔴  
  *Refs:* [supabase_report_2026-03.md](./supabase_report_2026-03.md)
- [x] **Layout Wishes (v1.1)** 🔴  
  *Refs:* [pixel_office_layout_v1_1_wishes.md](./pixel_office_layout_v1_1_wishes.md) - Design reference only

## 🔍 Human Review Requested
1. **Stock Forecast Cockpit (port 5005)**: Please verify if the underlying python service is currently active in the user environment.
2. **Criminology Lab**: Currently hidden due to a broken Mermaid generator; needs a decision on whether to repair or fully archive.

> **Resolved:** Supabase sync and 500 errors mentioned in prior docs have been addressed; current deployment uses the corrected configuration as per `docs/active/deploy_spec_netlify_supabase.md`.

*Last Reviewed: April 8, 2026 – Added Prometheus/Grafana metrics integration. Session summaries consolidated.*