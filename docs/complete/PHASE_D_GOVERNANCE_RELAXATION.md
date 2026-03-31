# Phase D – Governance Relaxation for Pixel Office GitHub Integration

**Date:** 2026-03-19  
**Phase:** Phase D – Clarify + simplify GitHub guardrails  
**Status:** Draft – primary brief for next opencode patch

## 1. Why Phase D Exists

Phase C introduced a `SafeScrumRepoClient`-style pattern and extra guardrails around GitHub integration. That pattern was *more restrictive* than intended and has created confusion and friction.

Pixel Office is now in a **stable** state. The original governance intent was:
- Use SCRUM to generate **GitHub-ready artifacts** (notes, reports) for a known repo.
- Allow automation to **read/write and push** in that repo, with sane scoping.
- Avoid complex, bespoke “safety wrappers” that paralyze day-to-day workflows.

Phase D is a correction: keep the useful bits (clear config, explicit modes) but remove overbuilt structures and unnecessary binds.


## 2. Governance Clarification

For the single, designated Pixel Office repo used for self-maintenance:

- It is **allowed and expected** that agents/server code:
  - Read and write SCRUM artifacts (`docs/PIXEL_OFFICE_SCRUM_NOTES.md`, `docs/reports/...`).
  - Commit and push those artifacts using **standard git/GitHub tools**.
- Guardrails should:
  - Clearly scope **which repo and branch** are used.
  - Avoid adding extra, bespoke client layers whose only job is “be more restrictive.”

In other words: constrain *where* we operate, not by inventing heavy abstractions that make it hard to operate at all.


## 3. What This Means for SafeScrumRepoClient

If Phase C added a `SafeScrumRepoClient` (or similarly named) module that wraps GitHub operations with additional policy logic, Phase D’s intent is to **simplify or remove it**.

### 3.1 Acceptable outcomes

Any of the following outcomes are acceptable (pick the simplest that fits the current code):

1. **Remove the SafeScrumRepoClient entirely**, and:
   - Use a thin, conventional Git/GitHub integration (REST API or `gh` CLI) directly in the SCRUM export path, configured with repo/branch.

2. **Downgrade SafeScrumRepoClient to a thin helper**, e.g.:
   - A small utility that just:
     - Reads repo/branch config from env.
     - Provides simple helpers like `commitAndPush(path, message)`.
   - No additional policy logic beyond “use this repo/branch.”

In both cases, the goal is to:
- Keep configuration **simple and explicit**.
- Avoid bespoke “safety framework” functionality that adds more steps or special-case failure states than normal git usage.


## 4. Guardrails: Right-Sized, Not Paralyzing

We still want *some* guardrails. Phase D clarifies them as follows:

- **Repo/branch selection is explicit, not magic**:
  - Configuration (env or config file) should specify which repo/branch Pixel Office uses for SCRUM sync.
  - That configuration is the *primary* safety mechanism.

- **No overbuilt wrappers whose only job is restriction**:
  - If a module exists solely to enforce additional policy constraints (multiple allowlists, complex validation layers, etc.), simplify it.

- **Normal development ergonomics matter**:
  - Running SCRUM and syncing its outputs to the Pixel Office repo should feel like a normal “generate + push” workflow, not like navigating a special safety subsystem.


## 5. Export Modes: Keep the Good Parts

From Phase C, we want to **keep** the distinction between local-only and GitHub-integrated modes, because that is useful and clear.

Recommended modes (rename to match existing code if necessary):

- **Local-only** (no GitHub calls):
  - `preview` – generate markdown only, no writes.
  - `localReport` – write `docs/reports/…` only.
  - `localNotes` – append to `docs/PIXEL_OFFICE_SCRUM_NOTES.md` only.

- **GitHub-integrated** (may commit and push):
  - `githubReport` – local report write + commit/push to configured repo.
  - `githubNotes` – local notes append + commit/push to configured repo.

Defaults:
- The API and UI should still **default to a local-only mode**, but GitHub modes should be straightforward to select and use.


## 6. What opencode Should Do

This document is the brief for the **next opencode patch** after the SafeScrumRepoClient work has landed.

High-level tasks for opencode:

1. **Inspect the current Phase C implementation** (including any `SafeScrumRepoClient`):
   - Identify where extra guardrails or complexity were added on top of normal git/GitHub usage.

2. **Simplify the integration** according to this Phase D governance:
   - Either remove the SafeScrumRepoClient (if it is primarily a guardrail abstraction), or
   - Reduce it to a thin helper that does not introduce extra policy complexity.

3. **Ensure export modes remain clear and usable**:
   - Local-only modes must continue to work without any GitHub configuration.
   - GitHub modes should be easy to trigger and behave like a normal git workflow (commit + push) for the configured repo.

4. **Update or add a short comment in the relevant modules** noting:**
   - "Phase D governance: Pixel Office is considered stable; GitHub integration for the configured repo should be straightforward. This module is intentionally lightweight and should not grow additional policy/guardrail logic."


## 7. Non-Goals

Phase D is *not* about:
- Introducing new safety frameworks.
- Expanding automation beyond the explicitly configured Pixel Office repo.
- Changing how SCRUM artifacts are generated (structure/format remains as defined in earlier phases).

It is **only** about:
- Removing accidental over-constraints.
- Restoring a smooth, ergonomic GitHub integration flow consistent with a stable, trusted office.
