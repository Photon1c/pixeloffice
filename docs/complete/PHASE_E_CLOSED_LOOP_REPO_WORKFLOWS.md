# Phase E – Closed-Loop Repo Workflows (Feature Branches + Notifications)

**Date:** 2026-03-19  
**Phase:** E – Closed-loop repo workflows  
**Status:** Draft – implementation brief for opencode / agent teams

## 1. Goal

Move Pixel Office from “SCRUM can describe repo work” to a **closed-loop repo workflow** where:

1. The team runs a SCRUM session focused on a repo topic.
2. Pixel Office generates a structured repo report and concrete actions.
3. Agents execute those actions on a **feature branch** (create branch, apply changes, run tests, push).
4. The user handles merges for now, but agents can:
   - Notify when a feature branch is ready for review, and
   - (Future) optionally notify when a PR is merged.

This should build on existing Time+Tasks, SCRUM, and GitHub integrations without introducing new heavy wrappers.


## 2. Scope

**In scope (Phase E):**
- Converting SCRUM outputs into actionable tasks tied to a specific repo + feature branch.
- Automating the **feature branch workflow** for a configured repo:
  - Create branch from a base (e.g., `main`).
  - Apply a bounded set of changes (docs/config/code) driven by tasks.
  - Run tests/linters.
  - Push branch to remote.
- Sending clear notifications when a feature branch is ready.

**Future (not in this phase, but design for it):**
- Automated PR creation and updating.
- Notifications when PRs are merged or closed (some devs already do this; we want to be compatible).


## 3. Trusted Operational Workflow

Per the updated `ETHICAL_CONTRACT.md`, this closed-loop workflow is intended to be a **trusted operational workflow** once tested:

- Restricted to a **configured repo/branch** (e.g., the Pixel Office repo).
- Behavior is deterministic, logged, and inspectable.
- Once marked ACTIVE, agents may run it end-to-end when invoked, without per-run approval, while still logging actions.

Configuration should clearly indicate:

```bash
PIXEL_REPO_OWNER=owner
PIXEL_REPO_NAME=pixel_office
PIXEL_REPO_DEFAULT_BRANCH=main
PIXEL_REPO_FEATURE_PREFIX=feature/
PIXEL_REPO_SCRUM_LABEL=pixel-office-scrum
```


## 4. High-Level Flow

### 4.1 SCRUM Session → Repo Report

1. User starts a SCRUM session with a repo-focused topic, e.g.:
   - `repo:pixel_office/improve-scrum-export-ui`
2. SCRUM runs through its stages (check → report → review → decide → execute → log).
3. At LOG stage, the system already:
   - Generates a markdown report (local + optional GitHub export).  
   - Summarizes findings, risks, and recommended actions.

### 4.2 Repo Report → Feature Branch Plan

From the SCRUM report/log:

- Extract or generate a **Feature Branch Plan**:
  - Suggested branch name, e.g.:  
    `feature/scrum-export-ui-improvements-2026-03-19`
  - A small, ordered list of **concrete steps**, such as:
    - Update docs file X.
    - Adjust component Y.
    - Add test Z.

- Represent this as:
  - A structured object (for APIs), and/or
  - A set of `tasks_v2` items tagged with the branch name.

### 4.3 Feature Branch Workflow

When the user confirms or initiates the workflow (button or API call):

1. **Create feature branch** from `PIXEL_REPO_DEFAULT_BRANCH`.
2. **Apply changes** for the first set of tasks:
   - Use existing coding/editing flows (agents or scripts) to modify files.
   - Keep changes small and scoped to the branch.
3. **Run checks**:
   - `npm test`, `npm run lint`, or configured commands.
4. **Push branch** to remote (GitHub).
5. **Notify user**:
   - “Feature branch `<name>` created and pushed. Here’s what changed and which tasks are still open/closed.”


## 5. Interfaces & Touchpoints

This phase should reuse existing systems and keep changes **surgical**.

### 5.1 SCRUM Integration

- Extend SCRUM LOG stage to optionally emit a **Branch Plan** along with the report, e.g.:

```json
{
  "sessionId": "scrum-123",
  "topic": "repo:pixel_office/improve-scrum-export-ui",
  "branchPlan": {
    "branchName": "feature/scrum-export-ui-improvements-2026-03-19",
    "tasks": [
      { "id": "task-1", "title": "Update SCRUM docs for new modes", "files": ["docs/active/scrum_phase_b.md"] },
      { "id": "task-2", "title": "Tighten ScrumPanel UI copy", "files": ["src/components/ScrumPanel.tsx"] }
    ]
  }
}
```

- Also write these tasks into `tasks_v2` with tags like:
  - `"repo"`, `"feature_branch"`, `branchName`, `sessionId`.

### 5.2 Feature Branch Controller

Introduce a **small controller/service**, e.g. `server/services/featureBranchWorkflow.ts`, responsible for:

- Reading the branch plan (from SCRUM log or tasks_v2).
- Creating the feature branch in the local clone.
- Applying file edits (delegating to existing agentic tooling when needed).
- Running tests and reporting results.
- Pushing the branch.

This should **not** reinvent git; it should:
- Use existing git CLI or a light wrapper.
- Operate only in the configured Pixel Office repo.

### 5.3 API Endpoints

Keep endpoints minimal and explicit. For example:

- `POST /api/repo/feature-branch/plan`
  - Input: `scrumSessionId` (or topic).
  - Output: computed `branchPlan` (no side effects).

- `POST /api/repo/feature-branch/apply`
  - Input: `branchPlan` or `scrumSessionId` + `confirm: true`.
  - Behavior: run the feature branch workflow described in §4.3.
  - Output: summary (branch name, changed files, test status, push URL).


## 6. Notifications

We want the system to be compatible with setups where agents can **notify the user when git work is done**, and in future, when PRs are merged.

For Phase E:

- On successful branch push, generate a notification payload including:
  - Branch name.
  - Repo URL and compare link.
  - Summary of tasks completed vs remaining.
- For now, notification can be:
  - A message into the existing CoolerTalk/FrontDesk UI, and/or
  - A log entry consumable by external notifiers.

Future-compatible design:
- Include a stable identifier (e.g. branch name + session ID) so another agent can later watch for PRs created/merged for that branch and trigger phone/chat notifications.


## 7. Guardrails & Safety

Consistent with Phase D and the updated ETHICAL_CONTRACT:

- This workflow is **scoped** to:
  - A single configured repo (`PIXEL_REPO_OWNER`/`PIXEL_REPO_NAME`).
  - A base branch (`PIXEL_REPO_DEFAULT_BRANCH`).
- Once tested and marked ACTIVE, it becomes a **trusted operational workflow**:
  - May run without per-run approval.
  - Must log actions (branch name, commands run, test status, push results).
- Experimental variants (e.g., new kinds of automated edits) should be clearly marked TEST and follow stricter approval paths.


## 8. Non-Goals for Phase E

- No automatic PR creation or merging.
- No cross-repo operations.
- No new generic GitHub wrappers beyond what Phase C/D already introduced.
- No UI redesign; integration should hook into existing SCRUM/TimeTasks/PixelOffice panels with minimal changes.


## 9. Implementation Notes

- Favor **incremental, test-backed changes**:
  - Unit tests for branch plan generation from SCRUM logs.
  - Integration tests for the feature branch workflow using a mock or test repo.
- Make the code paths **obvious**:
  - A new contributor should be able to trace: SCRUM LOG → branch plan → feature-branch controller → git operations → notification, without hopping through many layers.
- Keep the workflow small and inspectable so Leslie and other agents can trust it and debug it quickly if something goes wrong.
