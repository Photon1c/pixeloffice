# OpenCode ↔ OpenClaw Prompt Card Flows

This directory is the home for specs that define how Prompt Cards move between OpenCode and OpenClaw.

## Purpose
- Describe how AgentScroll receives and routes Prompt Cards.
- Define how router-visualizer reflects these routes and workflows.
- Specify how Pixel Office canvases (Pixel Me / Pixel Troupe) surface these flows.
- Standardize how OpenCode picks up and hands off work via Prompt Cards.

## Initial Focus
For 2026-04-05, the focus is:
1. Define 2–3 concrete example flows where:
   - A Prompt Card is created (by you or an agent).
   - AgentScroll accepts it and routes it across agents/tools.
   - Router-visualizer shows the route/workflow.
   - OpenCode picks up the work and hands results back into OpenClaw.
2. Keep this as a living spec; start small and refine based on real use.

Further docs will be added alongside this README (e.g., `flows.md`, `schema.md`, `handoff_examples.md`).
