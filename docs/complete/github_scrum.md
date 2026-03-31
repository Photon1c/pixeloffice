# Phase C – Pixel Office SCRUM → GitHub Integration

## Goal

Have Pixel Office use its own SCRUM feature to propose and implement changes in this repository (`Photon1c/pixeloffice`).

This phase does **not** change the core CoolerSession or SCRUM logic. Instead, it adds a narrow integration path:

- SCRUM sessions about this repo produce:
  - A short, GitHub-ready summary (markdown).
  - Optionally, a small code/doc change for the office to apply.
- Opencode (or a similar tool) uses that summary to:
  - Open/append to an issue on GitHub, and/or
  - Apply a small commit (e.g. doc tweak) in this repo.

## Scope

- Keep everything focused on **documentation and meta-structure**, not core engine code:
  - README tweaks
  - Docs under `docs/`
  - High-level notes about phases, features, or usage

## What already exists

- SCRUM implementation:
  - Types, controller, and routes under `server/scrum/`.
  - Logs saved as markdown in `data/scrum_logs/…`.
  - UI button and animations wired into PixelOffice.

- Docs and summaries:
  - `docs/PIXEL_OFFICE_PHASES_OF_IMPROVEMENT.md`
  - `docs/COOLERSESSION_EXEC_SUMMARY.md`
  - `docs/SESSION_SUMMARY_2026-03-18.md`
  - plus other dev logs under `docs/dev_logs/`.

## Tasks for Opencode / SCRUM Tightening

1. **Create a “SCRUM output” doc for GitHub use**

   Add a doc, for example:

   - `docs/PIXEL_OFFICE_SCRUM_NOTES.md`

   Behavior:
   - For selected SCRUM sessions (topic = “repo self-maintenance”, or similar), summarize:
     - Date
     - Topic
     - Key observations
     - Proposed changes (especially to docs/README)
   - Format each entry as an append-only markdown block that could be pasted directly into a GitHub issue or PR description.

2. **Add a simple “Phase C” SCRUM topic**

   Define a convention:
   - If SCRUM is started with topic = `"repo:pixeloffice/self-maintenance"` (or similar), the LOG stage:
     - Writes both the normal SCRUM log to `data/scrum_logs/…`
     - And appends a compact summary to `docs/PIXEL_OFFICE_SCRUM_NOTES.md` in the format above.

   Constraints:
   - Do not change the existing SCRUM routes or log formats.
   - Treat the new doc as an *additional* artifact.

3. **Keep Git actions manual (for now)**

   For this phase:
   - Do not have SCRUM itself call `git` or the GitHub API.
   - Instead, rely on:
     - The `PIXEL_OFFICE_SCRUM_NOTES.md` file as the “handoff” surface.
     - Human + Opencode to:
       - Turn these notes into:
         - Issues on GitHub (copy-paste).
         - Or small PRs that apply doc changes proposed by SCRUM.

   Later, we can consider automating the “open an issue” step; for now, the key is to prove that SCRUM can produce useful, structured guidance about this repo.

## Definition of Done

- A new doc exists in `docs/` (e.g. `PIXEL_OFFICE_SCRUM_NOTES.md`) where:
  - At least one SCRUM run about `pixeloffice` appends a well-formatted summary block.
- Running that SCRUM does **not** break any existing behavior:
  - SCRUM logs still appear under `data/scrum_logs/`.
  - API and UI behavior of SCRUM remain intact.
- The summary block is:
  - Short
  - Markdown-friendly
  - Clearly actionable as:
    - A GitHub issue body, or
    - A PR description

From there, future phases can wire these summaries into actual automated GitHub actions if desired.
