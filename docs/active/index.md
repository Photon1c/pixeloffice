# Pixel Office Active Features Index

This index tracks the implementation status of core features and recent upgrades in the Pixel Office environment.

## Currently Active Docs
- [ghost_executive.md](./ghost_executive.md) - User role concept
- [onboarding_models.md](./onboarding_models.md) - Model reference
- [opencode_pixel_office_tsa_health_ui_handoff.md](./opencode_pixel_office_tsa_health_ui_handoff.md) - TSA Health HUD (UI) + positioning polish handoff
- [opencode_cooler_to_scrum_meaningful_reports_handoff.md](./opencode_cooler_to_scrum_meaningful_reports_handoff.md) - Ensure Cooler → SCRUM produces meaningful reports (even "no action")
- [opencode_multi_upgrade_handoff.md](./opencode_multi_upgrade_handoff.md) - Multi-upgrade summary: meaningful reports, loop detection, news auto-refresh, Agentic OS Kernel reasoning loop
- [opencode_reflexive_arbiter_implementation.md](./opencode_reflexive_arbiter_implementation.md) - Reflexive Arbiter: Governance divergence assessment via multi-agent research scrum
- [opencode_reflexive_arbiter_measurement_validation.md](../opencode/reflexive-arbiter-measurement-validation.md) - Reflexive Arbiter v2.0.0: Measurement Validation methodology (Evidence Integrity, Governance Telemetry, Scoring Refinement, Benchmark Scrum, Reliability Testing)
- [opencode_reflexive_arbiter_limitations.md](../opencode/reflexive-arbiter-limitations.md) - Reflexive Arbiter v2.0.0: Remaining Architectural Limitations

## 🟢 Core Infrastructure
- [x] **Live Server (Node/Express)** - Unified backend for API and socket management ✅
- [x] **Vite Frontend** - High-performance React + Canvas engine ✅
- [x] **Persistence Layer** - File-based storage for cooler sessions and stigmergy ✅
- [x] **Multi-Agent Simulation** - Pathfinding, desk assignment, and autonomous wandering ✅

## 🟠 Stigmergy & Behavioral Fields
- [x] **Review Heat** - Visualized PR/review pressure in specific rooms ✅
- [x] **Task Shadows** - "Ghost footprints" at desks with unfinished work ✅
- [x] **Unfinished Work Hotspots** - Sidebar panel grouping shadows by agent (Lab Mode) ✅
- [x] **Social Potential** - Metric tracking recent cooler activity and participant density ✅
- [x] **Social Activity Meter** - HUD indicator for office social energy (Lab Mode) ✅
- [x] **Shadow-Biased Selection** - Backend weights biasing cooler sessions toward agents with shadows ✅
- [x] **Task Shadow Dedup** - Server dedup keys on agentId (not roomId) to prevent duplicate traces ✅
- [x] **Flywheel System** - Python MVP for residue capture, analysis, and promotion (moved to complete) ✅

## 🔵 Interactive Features
- [x] **Global Chat Overlay** - Centralized panel for agent/database interaction ✅
- [x] **Individual Agent Cards** - Contextual menus with mood toggles and agent-specific chat ✅
- [x] **Workflow Dropdowns** - Integration for GitHub README, SitRep, and Nightly workflows ✅
- [x] **Workflow Visualization** - Progress bars and step indicators on active agent cards ✅
- [x] **Cooler Talk Animation** - Autonomous gathering in the kitchen area ✅
- [x] **Test SCRUM Animation** - Coordinated gathering in the conference room ✅

## 🔬 Lab & Security
- [x] **Public vs. Lab Mode** - Environment-driven UI tightening (VITE_LAB_MODE) ✅
- [x] **Lab Tools Section** - Gated access to Terminal, Sherlock CS, and specialized labs ✅
- [x] **Protected Links** - External tool links restricted to authorized lab sessions ✅

## 🛠️ Maintenance & Delegation Features
- [x] **Favicon Support** - Character-based favicon to prevent 404s ✅
- [x] **Automated Data Directory Management** - Auto-creation of data paths ✅
- [x] **Handoff API** - Endpoint for local agent definitions and states ✅
- [x] **Stigmergy-Driven Task Selection** - Agents weighted by Task Shadow intensity ✅
- [x] **"Delegate to Office" Command** - Chat-based delegation detection → SCRUM creation ✅
- [x] **Office Status Panel** - Lab Mode panel showing task shadows & social activity ✅
- [x] **Sleep Mode** - Reduces agent movement & thought bubbles for rest periods ✅
- [x] **Vacation Mode Autopilot** - Periodically auto-triggers agent2agent, cooler, and scrum sessions ✅
- [x] **GitHub Workflow Visualization** - 4-step pipeline animation on FrontDesk card ✅
- [x] **Updated Local Models** - z-ai/glm4.7 for NVIDIA integration ✅

## 📊 Observability (April 8, 2026)
- [x] **Prometheus Metrics Endpoint** - `/metrics` on port 4173 scraped by Alloy ✅
- [x] **Grafana Integration** - Metrics sent to Grafana Cloud via Alloy ✅
- [x] **HTTP Request Metrics** - `pixel_office_http_requests_total`, `pixel_office_http_request_duration_seconds` ✅
- [x] **LLM Request Counter** - `pixel_office_llm_requests_total` by provider/model ✅
- [x] **Loop Detection Gauge** - `pixel_office_loop_detection` per agent ✅
- [x] **Stigmergy Deposit Counter** - `pixel_office_stigmergy_deposit_total` by type/status ✅
- [x] **Cooler Run-Turn Counter** - `pixel_office_cooler_run_turn_total` by location/status ✅
- [x] **Desk Stigmergy Gauges** - `pixel_office_desk_stigmergy` with heat types ✅

## 🧪 Measurement Validation (November 16, 2026)
- [x] **Evidence Integrity** - Source URI, timestamps, classification (observed/reported/inferred/hypothetical), source independence, verification status (verified/unverified/disputed/llm_assertion) ✅
- [x] **Governance Telemetry** - 8 measurable indicators (autonomous actions/hr, human review throughput, backlog, emergency interventions, MTTR, validation time, clearance time, external expertise dependency) with unavailable≠zero distinction ✅
- [x] **Scoring Refinement** - Max dimension divergence, critical dimension count, evidence coverage, dimension-level confidence, unresolved disagreement count; unknown ratings excluded from aggregation ✅
- [x] **Benchmark Research Scrum** - Three baseline assessments: FAA NOTAM outage (Nov 13), Google autonomous cyberattack (Nov 16), Pixel Office self-assessment ✅
- [x] **Reliability Testing** - 24/25 regression tests passing: missing/contradictory evidence, fabricated sources, KB unavailable, interrupted scrum, duplicate requests, concurrent sessions, cross-version comparison ✅
- [x] **Regression Test Suite** - `npm run test:arbiter` with vitest; full 7-stage workflow validation ✅

## 🛰️ Comparative Infrastructure Governance Divergence (November 17, 2026)
- [x] **Run** - `npx tsx scripts/run-infrastructure-governance-assessment.ts` produces a comparative governance-divergence assessment across Microsoft Outlook (Nov 12), FAA (Nov 13), United Airlines (Nov 16), Google (Nov 16), and NSA (Nov 17) ✅
- [x] **Deliverables** - 7-section comparative report appended after the standard 7-stage SCRUM run: timeline, governance-divergence matrix, evidence-backed dependency analysis, recovery-and-saturation indicators, competing-hypotheses-with-confidence, longitudinal monitoring recommendations, unresolved research questions ✅
- [x] **Preserved Disagreements** - 5 cross-investigator conflicts explicitly retained (authority dispersal, visibility scope, competency concentration locus, recovery definition, accountability framing) ✅
- [x] **Featured comparison axis** - "grounding aircraft" (FAA) vs "staggering employee arrivals" (NSA) — both institutions reducing physical/world activity to accommodate digital coordination limits ✅
- [x] **Primary NSA source** - [NSA public statement (Nov 17, 2026)](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4650245/nsa-statement-on-network-issues/) treated as the run's anchor ✅
- [x] **Latest run** - `arbiter-1794947488732-6ywcov` (assessment [JSON](../data/reflexive_arbiter/arbiter-1794947488732-6ywcov.json) · [report](../reports/reflexive_arbiter/arbiter-1794947488732-6ywcov.md)) — overall divergence **2.83/4.00**, **4/6 critical**, evidence coverage **100%**, confidence **72%**, has critical divergence **YES** ✅

---
*Last Updated: November 17, 2026*