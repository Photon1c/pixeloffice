# OpenCode Audit Workflow (Test Flow)

This document defines a test workflow where OpenCode audits a repository and produces an audit report.

## Flow 1: Repo Audit → Audit Report

**Goal:** Have OpenCode audit a repo and generate an audit report (file tree, logic flow diagram, and key observations), with the whole flow visible and traceable via Prompt Cards and the router-visualizer.

### 1. Prompt Card Creation (OpenClaw side)

**Trigger:** User (or another agent) wants an audit of a given repo.

**Prompt Card fields (conceptual):**
- `id`: unique Prompt Card id (e.g., `pc-2026-04-05-opencode-audit-001`).
- `kind`: `code_audit`.
- `origin`: `openclaw`.
- `target_agent`: `opencode`.
- `repo`: repository identifier and access method (e.g., Git URL, local path alias).
- `scope`:
  - file tree depth limits
  - whether to include tests, scripts, etc.
- `artifacts_expected`:
  - `audit_report.md`
  - `file_tree.md`
  - `logic_flow_diagram.json` or `logic_flow_diagram.mmd` (Mermaid)
- `constraints`:
  - time/size limits
  - any privacy or redaction rules.
- `return_channel`:
  - how results come back into OpenClaw (AgentScroll queue + Router workflow id).

The Prompt Card is submitted into **AgentScroll**.

### 2. AgentScroll Routing

AgentScroll receives the Prompt Card and:
- Validates minimal required fields (`kind`, `target_agent`, `repo`, `artifacts_expected`).
- Attaches routing metadata:
  - `workflow`: e.g., `RouterWorkflow:Default` or `RouterWorkflow:CodeAudit`.
  - `trace_id`: a stable trace id shared with router-visualizer.
  - `hop`: `openclaw → opencode`.
- Emits a route event that the **router-visualizer** consumes, so the card appears as:
  - Node: `OpenClaw`
  - Edge: `PromptCard: code_audit`
  - Node: `OpenCode`

### 3. Handoff to OpenCode

OpenCode picks up the Prompt Card via the agreed interface (e.g., queue, HTTP endpoint, or CLI invocation configured in AgentScroll).

OpenCode responsibilities:
- Resolve the `repo` to a working directory.
- Walk the repo:
  - Generate a **file tree** with size and type summaries.
  - Identify key entrypoints (e.g., main app, key services, important scripts).
- Generate a **logic flow diagram**:
  - High-level modules and their relationships.
  - Primary data/logic flows.
- Produce an **audit report**:
  - Overview of repo purpose (inferred).
  - Architecture summary.
  - Notable patterns / risks / TODOs.

OpenCode writes artifacts to a known location or returns them inline (per spec to be defined in `schema.md`).

### 4. Results Return via AgentScroll

OpenCode emits a completion payload with:
- `prompt_card_id`
- `status`: `completed` (or `failed`, `partial`)
- `artifacts`:
  - references/paths to `audit_report.md`, `file_tree.md`, `logic_flow_diagram.*`
- `notes`: any caveats, truncation, or TODOs.

AgentScroll receives this and:
- Updates the Prompt Card state to `completed`.
- Emits another route event for router-visualizer:
  - Edge: `OpenCode → OpenClaw` with `status: completed`.
- Dispatches a message back into OpenClaw (e.g., to Pixel Office) via the `return_channel`.

### 5. Visualization in Router-Visualizer

The router-visualizer should be able to show at least:
- A **workflow lane** (e.g., `Code Audit` workflow) containing:
  - `OpenClaw` node → `PromptCard: code_audit` → `OpenCode` node.
- State transitions:
  - `pending` → `in_progress` → `completed` on the Prompt Card.
- Links to artifacts (where supported) or at least labels like:
  - `Artifacts: audit_report.md, file_tree.md, logic_flow_diagram.mmd`.

### 6. Surfacing in Pixel Office

Pixel Office (e.g., Pixel Me or Pixel Troupe) surfaces:
- A tile/card for the **Code Audit** flow with:
  - Summary of repo and audit status.
  - Links to view the audit report and diagrams inline.
  - The underlying Prompt Card id and trace id for debugging.

---

**Next steps for this flow:**
- Define the concrete Prompt Card JSON/schema in `schema.md` for `kind: code_audit`.
- Specify the exact interface OpenCode uses to pick up the Prompt Card and return artifacts (CLI vs HTTP vs queue).
- Add 1–2 more example flows reusing the same schema pattern (e.g., "small refactor" or "test coverage review").
