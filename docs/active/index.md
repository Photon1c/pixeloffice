# Pixel Office Active Features Index

This index tracks the implementation status of core features and recent upgrades in the Pixel Office environment.

## Currently Active Docs
- [ghost_executive.md](./ghost_executive.md) - User role concept
- [onboarding_models.md](./onboarding_models.md) - Model reference

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

---
*Last Updated: April 8, 2026*