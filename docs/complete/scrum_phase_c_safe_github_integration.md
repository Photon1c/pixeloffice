# SCRUM Phase C — Safe GitHub Integration for Reports

**Date:** 2026-03-19  
**Status:** Draft — ready for opencode implementation

## 1. Intent

We now treat the SCRUM exporter and Time + Tasks backbone as **stable, GitHub-ready** features. Phase C restores and tightens **automated GitHub integration** for a *single, pre-approved safe repo* so that SCRUM reports and notes can be synced without human git commands, while keeping guardrails strict and explicit.

Goals:
- Allow agents/server code to **read/write via GitHub** for SCRUM outputs in the safe repo.
- Keep local-only workflows fully supported and the **default**.
- Ensure automation can **never touch non-approved repos or branches**.


## 2. Scope

**In scope:**
- A small GitHub client wrapper for a single safe repo.
- Export modes that optionally commit + push SCRUM outputs.
- Config and guardrails that constrain where automation can write.

**Out of scope (for this phase):**
- Multi-repo support.
- Non-SCRUM automation.
- Arbitrary git operations (rebases, merges, branch creation, etc.).


## 3. Safe Repo Configuration

Introduce a config block or environment variables defining the *only* allowed GitHub target for automation:

- `SAFE_SCRUM_REPO` — e.g. `leslie/pixel-office-scrum-safe` (owner/repo)
- `SAFE_SCRUM_BRANCH` — e.g. `main` or `scrum-log`
- `SAFE_SCRUM_REPORTS_DIR` — e.g. `docs/reports`
- `SAFE_SCRUM_NOTES_PATH` — e.g. `docs/PIXEL_OFFICE_SCRUM_NOTES.md`
- `GITHUB_TOKEN` — token with minimal repo scope for that repo only

**Requirements:**
- If any of the above are missing or invalid, **GitHub modes must fail fast** with a clear error; local-only modes must still work.
- Repo and branch must be treated as an **allowlist**, not a default. The GitHub client should refuse to operate on any other repo/branch.


## 4. GitHub Client Wrapper

Create a dedicated module, e.g. `server/github/safeScrumRepoClient.ts`:

Responsibilities:
- Encapsulate all GitHub-specific logic (REST API or `gh` CLI calls).
- Enforce the safe repo/branch/paths from config.

Suggested interface (TypeScript-ish sketch):

```ts
export interface SafeScrumRepoClientConfig {
  owner: string;      // from SAFE_SCRUM_REPO
  repo: string;       // from SAFE_SCRUM_REPO
  branch: string;     // SAFE_SCRUM_BRANCH
  reportsDir: string; // SAFE_SCRUM_REPORTS_DIR
  notesPath: string;  // SAFE_SCRUM_NOTES_PATH
}

export class SafeScrumRepoClient {
  constructor(config: SafeScrumRepoClientConfig) {}

  // Commit + push a single new report file under reportsDir
  async pushReport(localPath: string, commitMessage: string): Promise<void> {}

  // Commit + push the updated notes file
  async pushNotes(localPath: string, commitMessage: string): Promise<void> {}
}
```

Implementation notes:
- Validate on construction that `owner/repo`, `branch`, and paths are non-empty and look sane.
- Internally, use either:
  - GitHub REST API (preferred), or
  - `gh` CLI calls with explicit `--repo` and `--branch` arguments.
- All methods must:
  - Target **only** the configured repo/branch.
  - Refuse to operate if any config/env is missing.


## 5. Export Modes (Local vs GitHub)

Extend the existing SCRUM export modes so that GitHub integration is explicit, not implicit.

### 5.1 Local-only modes (default)

These modes never call GitHub and must remain fully usable even without any GitHub configuration:

- `preview`  
  - Generate markdown only; do not write to disk.

- `localReport`  
  - Write a new file under `docs/reports/` (e.g. `YYYY-MM-DD_scrum-*.md`).

- `localNotes`  
  - Append the report to `docs/PIXEL_OFFICE_SCRUM_NOTES.md`.

### 5.2 GitHub-integrated modes

These modes build on the local modes and add **optional push** to the safe repo:

- `githubReport`  
  - Behavior:
    1. Run `localReport` (write report file under `docs/reports/`).
    2. Use `SafeScrumRepoClient.pushReport()` to commit + push that file to the safe repo.

- `githubNotes`  
  - Behavior:
    1. Run `localNotes` (append to `docs/PIXEL_OFFICE_SCRUM_NOTES.md`).
    2. Use `SafeScrumRepoClient.pushNotes()` to commit + push the updated notes file.

**Important:**
- The **default** export mode for any UI endpoint remains **local-only**.
- GitHub modes must be selected explicitly (e.g. via a dropdown or radio buttons in the UI and a `mode` parameter on the API).


## 6. API and UI Wiring

### 6.1 Server endpoints

Reuse or extend the existing endpoints:

- `POST /api/scrum/export`  
  - Request body includes:
    - `sessionId`: string
    - `mode`: `'preview' | 'localReport' | 'localNotes' | 'githubReport' | 'githubNotes'`
  - Behavior:
    - Validate that the SCRUM session is complete (`LOG` stage reached).
    - Route to the appropriate export + optional GitHub push.
    - On GitHub mode failure (e.g. missing config), return a **clear error** while preserving any local writes already completed.

- `GET /api/scrum/export/preview/:sessionId`
  - Unchanged: generate preview-only markdown.

### 6.2 ScrumPanel UI

- Keep the existing export controls, but:
  - Make the current local-only modes explicit in the UI labels.
  - Add a “GitHub (safe repo)” section or option group for `githubReport` and `githubNotes`.
- Show clear status messages:
  - Success: “Report exported and pushed to safe repo.”
  - Partial failure: “Local export succeeded, but GitHub push failed: <reason>.”


## 7. Guardrails (Right-Sized)

We *want* GitHub integration for this safe repo, so guardrails should **constrain scope**, not block usage.

Guardrail rules:
- **Repo/branch allowlist**: 
  - All GitHub operations must use only the configured `SAFE_SCRUM_REPO` and `SAFE_SCRUM_BRANCH`.
- **Path allowlist**:
  - Reports must live under `SAFE_SCRUM_REPORTS_DIR`.
  - Notes must match `SAFE_SCRUM_NOTES_PATH`.
- **No global git**:
  - No shelling out to arbitrary `git` commands without explicit `--repo`/`--branch` tied to the safe repo.
- **Fail-fast on misconfig**:
  - If config/env is missing or malformed, GitHub modes must error cleanly and never attempt partial pushes.


## 8. Tests

Add tests alongside the existing SCRUM exporter tests, e.g. `server/scrum/tests/safeScrumRepoClient.test.ts` and extensions to `scrumExporter.test.ts`.

Test cases:
- **Config validation**
  - Constructing `SafeScrumRepoClient` with missing or invalid config throws a clear error.

- **Local vs GitHub separation**
  - `preview`, `localReport`, and `localNotes` never call the GitHub client.
  - `githubReport` and `githubNotes` both:
    - Perform their local work.
    - Invoke the appropriate GitHub client method with the expected paths.

- **Failure behavior**
  - When GitHub config is missing, GitHub modes:
    - Do not call GitHub.
    - Return an error explaining the configuration issue.
  - When the mocked GitHub API fails, the server:
    - Returns an error but can still report whether the local export succeeded.


## 9. Developer Notes

- Keep the GitHub client **small and focused**. It should do only what SCRUM exports need.
- Any future GitHub automation for other features should go through **separate, explicitly-scoped clients** (do not turn this into a generic GitHub gateway).
- Document in the README (or a short section in `docs/active/scrum_phase_c_safe_github_integration.md`) how to:
  - Configure the safe repo.
  - Run a full end-to-end test: complete a SCRUM session → export via `githubReport` / `githubNotes` → verify files in the repo.
