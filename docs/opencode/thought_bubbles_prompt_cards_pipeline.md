# Pixel Office Thought Bubbles → Prompt Cards → Model Hits → Scrum Pipeline

## Implementation Summary (2026-04-06)

**Status:** ✅ Router Visualizer Updated

Three new workflow layouts have been added to `~/tools/router-visualizer` to visualize the pipeline stages:

| Workflow | Core Ring | Middle Ring | Outer Ring |
|----------|-----------|--------------|------------|
| **thought-bubbles** | AGENT, REFLECT, OBSERVE, INTENT, CONTEXT | THOUGHT, VALIDATE, MAP_CARD, CONSTRAIN, ROUTE, TRACK | NVIDIA, OLLAMA, BITNET, RESULT, PROMOTE |
| **prompt-cards** | SOURCE, KIND, TARGET, TASK, CONSTRAINT | THOUGHT_SRC, MODEL_PREFS, MAX_TOKENS, RUNTIME, CHANNEL | PREFERRED, FALLBACK, BURST, RESPONSE, SCRUM_TASK |
| **scrum-pipeline** | EVAL, CHECK, DECIDE, CREATE, NOTIFY | PROMOTE, TASK_GEN, ISSUE_STUB, PR_STUB, LOG, TRACK | CONCRETE_WORK, COST_BENEFIT, REPO_ISSUE, SCRUM_BOARD, COMPLETE |

All three are now selectable in the router-visualizer dropdown at `/api/layout`.

---

## Purpose

Define how **Pixel Office agents** emit short "thought bubbles" that become
structured **Prompt Cards**, which can then:

- Hit one or more models (NVIDIA, Ollama, BitNet, etc.) for a bounded burst of
  reasoning or generation.
- Optionally promote into **scrum/repo workflows** when the thought implies
  concrete work.

Goal: keep local models (especially BitNet) used in **short, intentional
bursts**, avoid unbounded "inner monologues," and make agent thinking
observable and actionable.

---

## 1. Thought Bubbles (Pixel Office Layer)

### 1.1 Shape & Constraints

**Thought bubble** = a short, user-visible agent thought anchored in context.

Constraints:

- **Length:** 1–2 sentences, max ~240 characters.
- **Scope:** One clear idea, question, or intent.
- **No hidden work:** A thought can *suggest* an action, but the actual work
  must go through a Prompt Card / workflow.

Example thoughts:

- "I wonder what IronClaw is up to; I should check their latest ops notes."
- "This repo’s tests are flaky again; we may need a small audit task."
- "BitNet is running hot on this query; I should switch to a lighter model."

### 1.2 Data Model (frontend/backend)

Minimal thought bubble structure:

```jsonc
{
  "agent_id": "sherlock",          // Which in-office agent thought this
  "room_id": "ops-bridge",         // Pixel Office room / context
  "text": "I wonder what IronClaw is up to; I should check their latest ops notes.",
  "kind": "reflection",            // reflection | observation | intent
  "created_at": "2026-04-06T05:32:00Z"
}
```

The **Pixel Office backend** is responsible for:

- Validating length and allowed `kind` values.
- Recording thoughts (e.g., in Supabase) for later visualization.
- Emitting events that can be turned into Prompt Cards.

---

## 2. Thought → Prompt Card Mapping (AgentScroll Layer)

### 2.1 When a Thought Becomes a Card

A thought bubble should turn into a **Prompt Card** when:

- It implies a non-trivial action (check status, run an audit, open a PR, etc.).
- It references another agent’s domain (e.g., IronClaw, ZeroClaw) that requires
  a separate tool or model to answer.
- It’s something we want **tracked** as work, not just displayed as mood.

Examples:

- Thought: "I wonder what IronClaw is up to; I should check their latest ops notes."
  - Card: "Summarize the last 24h of IronClaw ops notes and highlight any incidents."
- Thought: "This repo’s tests are flaky again; we may need a small audit task."
  - Card: "Run a light code audit on repo X focused on flaky tests and test coverage."

### 2.2 Prompt Card Shape (Conceptual)

Prompt Cards created from thoughts should follow the existing AgentScroll
pattern (as documented in `docs/opencode/schema.md`), with a few extra
annotations:

```jsonc
{
  "id": "pc-2026-04-06-thought-001",
  "kind": "thought_action",                 // or more specific kind, e.g. code_audit
  "origin": "pixel_office",
  "source_thought": {
    "agent_id": "sherlock",
    "room_id": "ops-bridge",
    "text": "I wonder what IronClaw is up to; I should check their latest ops notes.",
    "created_at": "2026-04-06T05:32:00Z"
  },
  "target_agent": "ironclaw",              // who should act on this
  "task": "Summarize last 24h IronClaw ops notes and highlight incidents.",
  "model_preferences": {
    "preferred": ["nvidia", "ollama"],
    "fallback": ["bitnet_local"],
    "max_reasoning_tokens": 512            // keep bursts bounded
  },
  "constraints": {
    "max_runtime_seconds": 120,
    "max_cost_units": 1,
    "notes": "Short, high-signal summary only."
  },
  "return_channel": {
    "kind": "agentscroll",
    "workflow": "RouterWorkflow:Thoughts",
    "trace_id": "trace-thought-001",
    "target": "pixel_office"
  }
}
```

Key points:

- `source_thought` is **always** attached so we can trace what triggered the
  card.
- `model_preferences` gives a **priority stack** and caps reasoning depth.
- `constraints` enforce **short, bounded runs** instead of open-ended loops.

---

## 3. Model Hits (NVIDIA / Ollama / BitNet)

### 3.1 Model Selection

AgentScroll / OpenCode should interpret `model_preferences` like this:

1. Try providers in `preferred` order (e.g., `nvidia`, then `ollama`).
2. Use `fallback` (e.g., `bitnet_local`) only when preferred providers are
   unavailable or unsuitable.
3. For **BitNet** and other local models that can get loopy:
   - Enforce small `max_reasoning_tokens`.
   - Enforce low `max_runtime_seconds`.
   - Treat them as **burst engines**, not continuous background thinkers.

### 3.2 Metrics & Observability

Each model hit should emit at least:

- `pixel_office_llm_requests_total{provider,model,source="thought_card"}`
- `pixel_office_llm_request_duration_seconds_bucket{provider,model,source="thought_card"}`

So Grafana can show, per provider/model:

- How many thought-driven calls they’re serving.
- Latency distribution.
- Comparative load between NVIDIA/Ollama/BitNet.

---

## 4. Thought → Action → Scrum (Repo Workflow)

### 4.1 Promotion Rules

Not every thought should reach a repo or scrum board. Promotion should happen
only when:

- The Prompt Card result identifies **concrete work** (bug, refactor, missing
  tests, config drift, etc.).
- The cost/benefit is reasonable (e.g., small code changes, documentation
  updates, simple automation tweaks).

If a card is promotable, the pipeline is:

1. Thought bubble in Pixel Office.
2. Prompt Card via AgentScroll.
3. Model hit(s) via NVIDIA/Ollama/BitNet.
4. Result returned to Pixel Office.
5. Optional: create **scrum task** / repo issue / PR stub using existing
   workflows (which are already in place).

### 4.2 Example Flow

1. Agent thought in Pixel Office:
   - "Tests in repo X are flaky; I should confirm where they fail most often."
2. Prompt Card:
   - `kind: code_audit`, scope limited to test files and recent failures.
3. Model hits:
   - Preferred: NVIDIA; fallback: BitNet local with tight constraints.
4. Result:
   - LLM surfaces a small list of problematic tests and possible causes.
5. Promotion:
   - Create a small scrum task + repo issue: "Stabilize tests A, B, C" with
     links to logs and stack traces.

---

## 5. Guardrails & Limits

To keep this system safe and resource-efficient:

- **Thought length limit:** enforce on the backend; reject or truncate thoughts
  longer than 1–2 sentences.
- **Reasoning depth:** limit `max_reasoning_tokens` and
  `max_runtime_seconds`, especially for BitNet/local models.
- **Concurrency controls:** cap how many thought-derived Prompt Cards can be in
  flight at once per agent.
- **Observability:** ensure all thought-derived work is tagged (e.g.,
  `source="thought_card"`) so we can monitor:
  - How often agents generate thoughts.
  - How many thoughts become Prompt Cards.
  - How many Prompt Cards become actual repo/scrum work.

---

## 6. Handoff Notes for OpenCode

When picking this up, OpenCode should:

1. Align this spec with existing Prompt Card schemas
   (`docs/opencode/schema.md`) and flows (`docs/opencode/flows.md`).
2. Propose a small extension to the schema for `source_thought` and
   `model_preferences`.
3. Implement one **end-to-end prototype flow** for a single agent (e.g.,
   Sherlock) where:
   - A thought bubble in Pixel Office becomes a Prompt Card.
   - The card triggers a single, bounded model hit.
   - The result is visible back in Pixel Office and (optionally) promoted to a
     small scrum task.
4. Add metrics labels and a tiny Grafana panel to track
   `source="thought_card"` activity.

This document is intended to live alongside the existing Pixel Office and
OpenCode docs as the contract for **thought-driven automation**.
