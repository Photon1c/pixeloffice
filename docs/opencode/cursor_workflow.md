# Cursor / Opencode Workflow – Pixel Office

> This file is a stigmergic signal for future Cursor/Opencode agents working on the Pixel Office repo.
> Aim: Keep the workflow simple, safe enough, and predictable so Leslie can sleep and see the sun.

---

## 1. Branch & PR Conventions

**Branches created by Cursor/Opencode:**

- Use the pattern: `cursor/<short-topic>`
  - Examples:
    - `cursor/stigmergy-task-shadows-tuning`
    - `cursor/ui-lab-mode-cleanup`
    - `cursor/docs-index-complete`

**Pull Requests:**

In each PR description, please include:

- **Summary:** 2–3 sentences of what changed.
- **Scope:** brief list of main areas touched (e.g., "docs only", "frontend only", "server + docs").
- **Risk:** one of `low` / `medium` / `high`.
- **Validation:** what you ran (e.g., `npm run build`, `npm test`, other checks).
- **Spec reference:** which `docs/opencode/*.md` brief(s) this PR is implementing.

This keeps reviews quick and lets humans/agents understand intent without re-reading the entire diff.

---

## 2. Specs Live in `docs/opencode/`

Cursor/Opencode should treat `docs/opencode/` as the **source of truth** for work:

- Implement only what's described there, unless a human explicitly asks for something ad hoc.
- If you notice the brief is ambiguous or outdated, mention that in the PR and suggest a small doc update.

Current types of briefs include:

- UI cleanup & mode gating (`ui_cleanup_brief.md`)
- Stigmergy next steps (`stigmergy_next_steps.md`)
- Reliability & workflow tests (`reliability_workflows_spec.md`)
- Agent Workspace Editor proposal (`agent_workspace_editor_proposal.md`)

---

## 3. Default Safe Areas (No Extra Ceremony Needed)

By default, it is **okay** for Cursor/Opencode to work on:

- `src/` (frontend) – components, styles, small feature wiring
- `server/` – small, well-scoped endpoints and glue logic
- `docs/` – any files under `docs/` (active, complete, opencode)
- `tests/` – adding or adjusting tests and test scaffolding
- `netlify/` – Netlify functions and config, as long as env var names are respected

As long as the work stays within a clear brief and passes `npm run build` (and any specified tests), this is considered normal, low/medium risk work.

---

## 4. Higher-Sensitivity Areas (Needs Explicit Brief Permission)

Cursor should **only touch these when the brief explicitly says so**:

- **Database schema / migrations**
  - Any change to `supabase_phase*_schema.sql` or equivalent.
- **Secrets / environment variables**
  - `.env`, Netlify env var naming, Supabase policy configuration.
- **Security / auth / access control**
  - RLS policies, role handling, auth guards.
- **Core routing / autonomy rules**
  - Fundamental changes to how requests are routed or how autonomy levels (Green/Yellow/Red) are enforced.

If a brief greenlights touching one of these, call it out clearly in the PR description under **Scope** and **Risk**.

---

## 5. Human-in-the-Loop Merging

- Cursor/Opencode should **never self-merge** PRs into `main`.
- A human (Leslie) or a designated reviewing agent will:
  - Review the diff against the brief.
  - Confirm the risk level and validation steps.
  - Merge or close the PR.

If you believe a change is especially safe and merge-ready, say so—but the final decision stays human-side.

---

## 6. Why This Exists

This repo has multiple agents and tools contributing over time (Pixel Office itself, OpenClaw, Cursor, Opencode). Having a small, shared workflow:

- Reduces friction and confusion.
- Keeps changes legible months later when we revisit them.
- Allows more semi-autonomous work **without** losing control over structure, security, or intent.

If you’re a future agent reading this and the reality has drifted, feel free to propose updates to this workflow via a new brief + PR rather than ignoring it outright.