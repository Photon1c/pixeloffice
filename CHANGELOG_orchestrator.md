# Orchestrator & Routing Stack – Session Changelog

**Date:** 2026-03-24

## 1. Hermes (former “White Rabbit”)

- Hermes was validated as functional but is no longer the primary orchestrator on this VPS.
- Observations:
  - Appears GPU‑oriented and better suited for cloud providers.
  - Local inference on a 2‑CPU‑thread VPS is too slow for interactive use, even with ~1B models.
  - Tool stack is heavy, pushing large context windows and resource usage.
- Decision:
  - Hermes is **deprioritized** as the main orchestrator.
  - Retained as a **secondary / specialist tool** for future GPU or cloud‑based experiments.

## 2. Time Orchestrator (ZeroClaw + PhysicsObsession/blase-3b)

- A new meta‑layer orchestrator was established for Pixel Office.
- Agent: **Time Orchestrator** (via ZeroClaw).
- Model configuration:
  - Primary: **PhysicsObsession/blase-3b:latest** (Ollama, tier: local-small).
  - Fallback: **gpt-4.1-mini** if local inference is unavailable.
- Rationale:
  - From `~/projects/model_foundry/registrar/registry.json`, `PhysicsObsession/blaze-3b` scores **80 / pass** across:
    - custodian, clerk, clerk+, specialist, executive
  - Classified as a strong all‑rounder for routing and coordination.
- Responsibilities (from STRATEGY.md):
  - Observe system state (tasks, sessions, events).
  - Route incoming events to appropriate agents.
  - Trigger workflows (standups, SCRUM, cooldown, task routing).
  - Maintain cadence/heartbeat across the agent ecosystem.
- Documentation:
  - Strategy doc at:
    - `apps/pixelworld/pixel_office/docs/office_strategies/time-orchestrator/STRATEGY.md`
  - Status:
    - ✅ Agent card added and configured for ZeroClaw + blase-3b.
    - ⏳ Event-system integration pending.
    - ⏳ Detailed workflow trigger implementations pending.

## 3. Model Registry & Local Models (Ollama)

- The VPS Ollama model set was cleaned up; key remaining models include:
  - `PhysicsObsession/blaze-3b:latest`
  - `phi3:mini`
  - `gemma-3-1b-it:latest`, `gemma-clerk:latest`
  - `potatopeeler:latest`, `potatowasher:latest`
  - `smollm:latest`, `tinyllama:latest`
  - plus a small set of themed/persona models.
- `~/projects/model_foundry/registrar/registry.json` records role-based fitness from HR benchmarks (`pixel_office_hr_report.json`).
- From this data, **blaze-3b** is currently the preferred local orchestrator model; `phi3:mini` and selected Gemma/Phi/Potato models are viable backups.

## 4. tiny-router Evaluation (Local VPS)

- **Tool:** `tiny-router` – compact, multi‑head text classifier for short, domain‑neutral routing decisions.
- Heads:
  - `relation_to_previous`: new | follow_up | correction | confirmation | cancellation | closure
  - `actionability`: none | review | act
  - `retention`: ephemeral | useful | remember
  - `urgency`: low | medium | high

### 4.1 Status

- Pipeline verified end‑to‑end on the VPS:
  - Training: `make train` (completes successfully).
  - Evaluation: `make eval` (baseline metrics produced).
  - Manual inference: `scripts.predict` (single‑case checks).
  - Batch harness: `test_tiny_router_batch.py` over 25 synthetic scenarios.

### 4.2 Performance Snapshot

- Test set: 25 curated scenarios (noise, tasks, corrections, cancellations, memory, urgency).
- Exact match rate across all four heads: **68% (17/25)**.
- Sample coherent output:

  ```json
  {
    "relation_to_previous": "correction",
    "actionability": "act",
    "retention": "useful",
    "urgency": "medium",
    "overall_confidence": 0.76
  }
  ```

### 4.3 What’s Working

- Correctly identifies:
  - corrections and follow‑ups vs new messages,
  - actionable vs non‑actionable content in many cases,
  - basic conversational/intent structure.
- Confidence scores are reasonably calibrated (not universally overconfident).
- Multi‑head outputs align cleanly with the intended routing schema:
  - `relation_to_previous`, `actionability`, `retention`, `urgency`.

### 4.4 Observed Limitations

- 68% exact match is **not yet sufficient** for autonomous routing authority.
- Likely error patterns (to validate with deeper inspection):
  - Over/under‑triggering `actionability = act`.
  - Ambiguity between `retention = ephemeral` vs `useful`.
  - Inconsistent `urgency` classification.
- Performance on this CPU‑bound VPS may constrain real‑time usage depending on batch size and call frequency.

### 4.5 Test Infrastructure

- A reusable test harness was created:
  - Batch testing via `test_tiny_router_batch.py`.
  - Structured JSON output for analysis.
  - Per‑head accuracy tracking (planned/partial).
  - Miss‑inspection script for targeted debugging.
- This supports:
  - regression testing,
  - dataset refinement,
  - future model comparison.

### 4.6 Architectural Role

- Current classification: **"Shadow-mode triage layer (experimental)"**.
- Not yet promoted to: **"Primary front‑desk router"**.
- Conceptual mapping in Pixel Office:
  - **tiny-router ≈ front desk agent**
    - Quickly triages events/messages and emits routing signals.
  - **Time Orchestrator ≈ operations manager**
    - Consumes tiny-router signals (in the future) and performs deeper planning/routing via ZeroClaw + blase-3b.

### 4.7 Recommended Next Steps

1. Analyze failure cases from the 25‑case batch to separate acceptable ambiguity from dangerous misclassifications.
2. Run tiny-router in **shadow mode** on real messages/events:
   - Log predictions but do not enforce decisions yet.
3. Implement a Blaze‑3B routing wrapper over the same schema and compare:
   - latency, routing quality, consistency vs tiny-router.
4. Start a data flywheel:
   - Log inputs, router predictions, and actual outcomes.
   - Use logs as training data for future tiny-router refinements.

## 5. Current Architectural Summary

- **Time Orchestrator (ZeroClaw + PhysicsObsession/blase-3b)**
  - Primary decision‑maker for routing, timing, and workflow coordination.
- **tiny-router**
  - Functionally viable compact classifier.
  - Currently in **calibration and validation** as a shadow‑mode triage layer.
- **Hermes**
  - Proven but resource‑heavy orchestration stack.
  - Deprioritized on this VPS; reserved for future GPU/cloud scenarios.

This changelog captures the current state so other agents and tools can align on which components are authoritative (Time Orchestrator + blaze-3b) and which are experimental (tiny-router, Hermes on this hardware).
