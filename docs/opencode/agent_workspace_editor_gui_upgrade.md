# GUI Upgrade Proposal: Agent Workspace Editor

## Summary

This proposal adds a new GUI surface in OpenCode: an **Agent Workspace Editor** that allows agents to safely propose, preview, and submit workspace changes through a structured interface instead of raw terminal-only workflows.

The editor is designed for:

- Agent-authored change proposals (files, patches, tests, commit intent)
- Human review with clear diffs and risk signals
- Fast iteration loops without losing safety boundaries

---

## Problem

Current agent workflows are powerful but fragmented:

- Context gathering, file editing, and command execution are split across multiple tools
- Change intent is often implicit in chat, not captured as structured metadata
- Reviewing proposed edits can require manual reconstruction of what changed and why

We need a GUI that lets agents produce **auditable, reviewable, and runnable** change proposals inside the workspace.

---

## Goals

1. Let agents draft and refine multi-file changes in one UI.
2. Make each proposal explicit: objective, files touched, commands run, risks.
3. Provide first-class diff and validation UX before commit/PR actions.
4. Keep a strict safety model (allowed paths, command policy, write boundaries).

## Non-Goals (Phase 1)

- Fully autonomous merge without human visibility
- Replacing git workflows (branching, commits, PRs stay central)
- IDE parity with every advanced coding feature

---

## Proposed UX

### 1) Proposal Workspace (new top-level panel)

Each agent creates a **Proposal Session** with:

- Title + intent (e.g., "Add retry logic to webhook sender")
- Scope tags (bugfix/docs/refactor/tests)
- File targets (explicit allowlist)
- Acceptance checks (lint/tests/typecheck commands)

### 2) Split Editor + Live Diff

- Left: editable files (multi-tab editor)
- Right: unified diff for current proposal
- Inline controls:
  - "Explain this hunk"
  - "Regenerate hunk"
  - "Revert hunk"
  - "Mark risky change"

### 3) Command Runner with Guardrails

Agent can execute predefined commands in-session:

- `npm test`, `npm run lint`, `pytest`, etc.
- Command log is attached to proposal metadata
- Policy engine blocks disallowed commands/paths

### 4) Validation Gate

Before commit-ready status:

- Required checks must pass or be explicitly waived with reason
- Agent must provide:
  - Change summary
  - Risk notes
  - Rollback note

### 5) Handoff to Git Actions

One-click transition from proposal to:

- Staged files review
- Commit message draft
- PR body draft (from proposal metadata)

---

## Core Data Model

```ts
type ProposalSession = {
  id: string;
  agentId: string;
  title: string;
  intent: string;
  scopeTags: string[];
  allowedPaths: string[];
  status: "draft" | "validating" | "ready_for_review" | "submitted";
  files: ProposedFileChange[];
  commandRuns: CommandRun[];
  riskAssessment: {
    level: "low" | "medium" | "high";
    notes: string;
    rollbackPlan: string;
  };
  createdAt: string;
  updatedAt: string;
};
```

---

## Suggested Architecture

### Frontend

- New route/panel: `Agent Workspace Editor`
- Monaco-based editor (or existing editor component extension)
- Diff viewer component with hunk-level actions
- Session timeline (edits, commands, check results)

### Backend

- Proposal session API (create/update/finalize)
- Policy engine service for command and path allowlists
- Execution adapter for safe command runs
- Diff and patch normalization service

### Integration Points

- Existing git branch context
- Existing tool-call history and command logs
- PR creation pipeline (title/body scaffolding)

---

## Safety Model

1. **Path Policy:** write access limited to repo and optional subpath allowlist.
2. **Command Policy:** only commands from approved list run in GUI mode.
3. **Secret Hygiene:** redact env/secret values in logs and previews.
4. **Destructive Action Interlocks:** deletes and mass rewrites require explicit escalation.
5. **Audit Trail:** every proposal mutation and command run is recorded.

---

## MVP Scope (Recommended)

Phase 1 (MVP):

- Proposal session creation
- Multi-file edit + diff preview
- Approved command runner + logs
- Validation checklist
- Export to commit/PR draft payload

Phase 2:

- Suggested edits from multiple agents merged into one proposal
- Semantic risk scoring
- Replay mode for "how this proposal was produced"

Phase 3:

- Cross-repo proposal orchestration
- Policy templates per team/project

---

## Acceptance Criteria

- Agent can create and complete a proposal without leaving GUI.
- Reviewer can understand what changed and why in under 2 minutes for small patches.
- Failed validation is visible and blocks "ready" status unless waived.
- Proposal can be converted into commit + PR draft with no manual copy/paste.

---

## Open Questions

1. Should proposal sessions be branch-scoped or workspace-scoped?
2. Which command presets are enabled by default per repo type?
3. Should "high risk" proposals always require human approval, even in lab mode?
4. Do we persist proposal sessions in DB, local files, or both?

---

## Recommendation

Implement the **MVP in `docs/opencode` scope first** as a feature flag behind lab mode. This delivers immediate usability for agent-authored changes while preserving current git-based governance and review safety.
