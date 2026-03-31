# Pixel Office – SCRUM Phase B: Local Markdown Report Export

You are Sherlock, acting as reviewer, architect, and integration governor for Pixel Office.

Your task is NOT to directly implement this feature yet.
Your task was to:
1. review the proposed Phase B direction,
2. identify missing decisions or risks,
3. refine the plan into a safe implementation brief,
4. then produce a clean Opencode handoff prompt.

This document is the resulting implementation brief + Opencode prompt.

---

## 1. Review

Using a generated markdown report (e.g., `docs/reports/YYYY-MM-DD_scrum.md`) as the first repo-facing artifact is the right Phase B move. It keeps the flow:

> SCRUM → structured summary → file artifact

without touching GitHub APIs, commits, or README. It fits existing Pixel Office patterns (markdown logs, JSON serialization, Time + Tasks backbone) and is easy to inspect, diff, and roll back. This aligns with the ETHICAL_CONTRACT: low-impact, reviewable, and limited to local filesystem writes inside a known project.

---

## 2. Risks

Key architectural/operational risks:

- **Path & naming drift**
  - If the artifact path/pattern isn’t clearly defined, different agents may generate files in inconsistent locations or with slightly different names.

- **Schema / structure drift**
  - If the markdown structure isn’t nailed down, we’ll end up with multiple “almost-but-not-quite” formats, making later automation brittle.

- **Trigger ambiguity**
  - If “when to write the artifact” is unclear (auto-on-LOG vs explicit trigger), we can get duplicate reports for a single SCRUM or reports for incomplete sessions.

- **Tight coupling to current SCRUM internals**
  - If this report writer reaches deep into SCRUM’s internal representation instead of a stable “SCRUM result” interface, small changes in SCRUM can break reporting.

- **Silent failures**
  - If markdown generation fails without clear logging, the user may think Phase B is working when nothing is being written.

- **Scope creep toward GitHub**
  - If not clearly constrained, devs/agents may be tempted to “just also open an issue” or wire in commits as part of this Phase B.

---

## 3. Missing Decisions

These should be explicitly decided before implementation:

- **Artifact path**
  - Confirm: `docs/reports/` within the Pixel Office repo.
  - Decide whether to create the directory automatically if missing (recommended: yes).

- **Naming convention**
  - Proposal: `YYYY-MM-DD_scrum-<sessionId>.md`
    - e.g., `2026-03-19_scrum-abc123.md`.

- **Trigger mechanism**
  - Recommended for v1: **explicit trigger only**.
    - Backend function called intentionally (e.g. via dev tool or future UI button).
    - It validates that the SCRUM is complete before writing.

- **Source of truth for content**
  - For v1, the artifact should be **SCRUM-only**:
    - Derived solely from SCRUM session data (stages + outputs).
    - Time+Tasks enrichment can be added in later phases.

- **Storage locality**
  - Phase B v1 is **local-only**:
    - Write under the Pixel Office working tree.
    - No GitHub API calls, no automatic commits.

- **Idempotency / overwrite behavior**
  - Tie filename to a **SCRUM session id**; exporting the same session rewrites the same file.

- **Report schema**
  - Sections (at minimum):
    - Metadata (time, session id, participants/roles if available).
    - Stage-by-stage log:
      - `## CHECK`
      - `## REPORT`
      - `## REVIEW`
      - `## DECIDE`
      - `## EXECUTE`
      - `## LOG`
    - Summary / Next Actions.

- **Dry-run**
  - Provide a function that returns the markdown as a string without writing to disk (for tests/preview).

---

## 4. Recommended Phase B Scope

**Goal:** Implement a small, deterministic “SCRUM → markdown report” subsystem that lives entirely within the Pixel Office backend, with no network or GitHub mutation.

### Phase B v1: Minimal, Safe Scope

- **Artifact generation**
  - Implement a pure function/module:
    - Input: a completed SCRUM session object (or stable SCRUM result DTO).
    - Output: markdown string following a fixed schema.

- **File writer**
  - Implement a writer that:
    - takes the markdown string + SCRUM metadata,
    - resolves a path under `docs/reports/`,
    - writes the file, creating `docs/reports/` if needed.
  - Filename:
    - `docs/reports/YYYY-MM-DD_scrum-<sessionId>.md`.

- **Trigger**
  - Implement a **single explicit export pathway**:
    - e.g., a backend function: `exportScrumReport(scrumSessionId)`.
    - It validates that the SCRUM is in a completed state (`LOG` reached) before exporting.

- **Content scope**
  - For v1, report includes:
    - SCRUM metadata: id, timestamps, participants/roles (if available).
    - Stage summaries for: CHECK → REPORT → REVIEW → DECIDE → EXECUTE → LOG.
    - Key decisions and next actions, as recorded by SCRUM.

- **Testing**
  - Add tests that:
    - run or mock a completed SCRUM session;
    - generate markdown and assert on sections and content;
    - run the writer and assert on path, existence, and content.

- **No GitHub behavior**
  - No GitHub API calls.
  - No automatic git add/commit/push.
  - README untouched.

---

## 5. Guardrails

Before implementation, these constraints are mandatory:

- **No external side effects beyond file write**
  - Allowed:
    - Read SCRUM/session data from local storage.
    - Write markdown into `docs/reports/`.
  - Not allowed:
    - GitHub API calls.
    - Other network requests.
    - Writes outside the Pixel Office working tree.

- **Completed SCRUM only**
  - Report generation must:
    - Check that the SCRUM session has reached `LOG`.
    - Refuse or error clearly if the session is incomplete/invalid.

- **Deterministic format**
  - Same SCRUM data → same markdown bytes.
  - No new dynamic timestamps/IDs in the report body beyond what already exists in SCRUM metadata.

- **Clear logging on failure**
  - On any error (missing session, incomplete state, filesystem error):
    - Log a structured error (session id, path, error reason).
    - Do not leave half-written files.

- **Stable, narrow interface to SCRUM**
  - Consume SCRUM via a stable DTO/public API, not deep internals that are likely to change.

- **Respect ETHICAL_CONTRACT**
  - Keep this as a low-blast-radius, local-only feature.

---

## 6. Opencode Prompt

You are OpenCode working on the Pixel Office repo.

You are not allowed to call GitHub APIs, perform git commits, or modify README. Your task is to implement a **safe Phase B bridge** from SCRUM into a local markdown report artifact.

### Context

Pixel Office currently has:

- **SCRUM Phase 3A** implemented as a strict six-stage workflow:  
  `CHECK → REPORT → REVIEW → DECIDE → EXECUTE → LOG`
- A **Time + Tasks backbone**:
  - `events`
  - `tasks_v2`
  - `sessions`
- Persistence, markdown logging, JSON serialization, and tests.
- A GitHub repo, but Phase B **must not** touch GitHub yet.

There is a design doc for Time + Tasks here (background only):

- `docs/active/time_tasks_v1.md`

You do not need to modify Time + Tasks for this task.

### Goal

Implement a **local markdown report exporter** for completed SCRUM sessions:

- Input: a completed SCRUM session.
- Output: a markdown file on disk under `docs/reports/`.
- No GitHub APIs, no commits, no auto-push.
- Deterministic formatting, easy to inspect and diff.

This is the first Phase B repo-facing artifact and must be:

- safe
- reviewable
- deterministic
- easy to audit
- easy to roll back

### Requirements

1. **Report generator (pure)**

Implement a function/module that:

- Accepts a completed SCRUM session (or stable SCRUM result DTO).
- Returns a markdown string that includes, at minimum:

  - Header with:
    - Date/time of SCRUM.
    - SCRUM session id.
    - Any known participants/roles if available.
  - A section per stage:
    - `## CHECK`
    - `## REPORT`
    - `## REVIEW`
    - `## DECIDE`
    - `## EXECUTE`
    - `## LOG`
  - Under each section, include the key structured output from that stage (e.g., bullet lists, decisions, summaries).
  - A final **Summary / Next Actions** section that pulls any explicit next steps captured during SCRUM.

Constraints:

- The function should be **pure**: given the same SCRUM data, it produces the same markdown string.
- Do not include new dynamic timestamps beyond what’s already in the SCRUM data.

2. **File writer**

Implement a small helper that:

- Takes:
  - the markdown string from the generator,
  - the SCRUM session id,
  - the SCRUM date/time.
- Resolves an output path under the Pixel Office repo:

  - Directory: `docs/reports/`
  - Filename pattern:
    - `YYYY-MM-DD_scrum-<sessionId>.md`
    - e.g., `2026-03-19_scrum-abc123.md`

- Ensures `docs/reports/` exists (create if necessary).
- Writes / overwrites the file atomically if possible.

3. **Trigger function**

Implement a backend function such as:

- `exportScrumReport(scrumSessionId: string): Promise<{ path: string }>`

Behavior:

- Loads the SCRUM session by id from the existing SCRUM storage.
- Verifies that the SCRUM is **completed** (has reached the `LOG` stage).
  - If not, return a clear error (do not write a partial report).
- Calls the report generator to create the markdown content.
- Calls the file writer to persist it under `docs/reports/`.
- Returns the path of the written file.

Optional but preferred:

- A variant that operates on “most recent completed SCRUM” if no id is provided.

4. **Dry-run support**

Provide a way to run report generation without writing to disk, e.g.:

- `previewScrumReport(scrumSessionId: string): Promise<string>`

This should return the markdown string without touching the filesystem (useful for tests or a future UI preview).

5. **Tests**

Add tests that:

- Create or mock a completed SCRUM session covering all six stages.
- Call the pure report generator:
  - Assert that all six section headers appear.
  - Assert that key parts of SCRUM data show up in the right sections.
- Call the writer/export function:
  - Assert that the path matches the naming convention.
  - Assert that the file exists and its contents match the generator output.
- Verify behavior when:
  - Session id is missing or invalid.
  - SCRUM is not completed (should fail cleanly and not write a file).

6. **Non-goals / prohibitions**

Do **not** implement:

- Any GitHub API integrations.
- Any git add/commit/push behavior.
- Automatic README editing.
- Automatic scheduling or cron for exports.

Exports should be:

- Explicit (via a function you implement).
- Local-only.
- Patch-sized changes confined to the Pixel Office backend and tests.

### Integration Notes

- Keep the interface to SCRUM **narrow and stable**:
  - Prefer a “SCRUM result” DTO if one exists, or add a small adapter that maps internal SCRUM structures into a clean report input type.
- Place new files/modules alongside existing SCRUM/session handling code, following current project conventions.
- If you introduce new utility functions or types, keep them small, documented, and easy to extend later (e.g., we may later add sections for Time + Tasks context or GitHub issue proposals, but that is **not** part of this task).

When you’re done, maintainers should be able to:

- Run tests to validate the feature.
- Call a single function (or future UI button) to export a markdown report for a completed SCRUM.
- Open `docs/reports/*.md` and clearly see what happened in that session, with no external side effects.
