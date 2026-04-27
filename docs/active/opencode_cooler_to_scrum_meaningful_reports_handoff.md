# OpenCode Handoff: Cooler → SCRUM should always produce a meaningful report (even if “no action”)

Date: 2026-04-22

## Context
Pixel Office has a strong “thought / speech / action” loop (stigmergy + cooler talk + SCRUM tooling), but the bridge still leaks value:
- Cooler sessions reliably generate **SCRUM candidates** (yellow zone).
- Candidate approval currently creates a **planning markdown stub**, but does not reliably produce a completed SCRUM session + exported report.
- Some SCRUM outputs can end up with **no suggested actions** (or “Summary: N/A”), which defeats the goal of turning talk into usable guidance.

Leslie’s requirement: the pipeline must output a **report with suggestions every time**, even if the best suggestion is “no action, monitor”.

## Goal
For any approved cooler-derived SCRUM candidate, the system should produce:
1) A completed SCRUM session (check → report → review → decide → execute → log)
2) An exported SCRUM report (local markdown at minimum)
3) A “suggestions” payload that is never empty

## Current state (what exists today)
### Cooler → candidate creation
- Cooler turn endpoint auto-creates candidates:
  - `POST /api/rooms/:location/cooler/run-turn`
  - Calls `maybeCreateScrumCandidate(...)`
- Candidate files:
  - `data/scrum_candidates/*.json`
- Code:
  - `server/cooler/scrumCandidates.ts`

### Candidate approval
- Endpoint:
  - `POST /api/scrum/candidates/:id/approve`
- Behavior today:
  - Marks candidate approved and writes a planning doc under `docs/scrum/`.
  - Does not start/complete a SCRUM session or export a report.
- Code:
  - `approveScrumCandidate()` in `server/cooler/scrumCandidates.ts`

### SCRUM session + reporting
- Session runner (staged pipeline):
  - `server/scrum/scrumController.ts`
  - Types: `server/scrum/types.ts`
- Exporter:
  - `server/scrum/scrumExporter.ts`
  - Writes to `docs/reports/` and appends to `docs/PIXEL_OFFICE_SCRUM_NOTES.md` (depending on export mode)
- Export endpoint:
  - `POST /api/scrum/export`

## “Meaningful report” definition (what we want)
A report is considered meaningful if it includes:
- A clear topic and source
- A short summary of what triggered it
- A decision (implement, defer, escalate, close)
- At least one suggestion in plain English
  - Example “no action” suggestion:
    - “No action required right now. Monitor for 7 days and revisit if X happens.”

## Required invariant: suggestions never empty
Right now, `runReviewStage()` can emit `recommended_actions: []`.

Implement this invariant:
- If `recommended_actions` is empty, inject a single “no action” recommendation.

Suggested default string (fine to tweak):
- `"No action recommended right now. Monitor and revisit if new evidence appears."`

File:
- `server/scrum/scrumController.ts` (`runReviewStage`)

This one change makes `scrumExporter.ts` always print a Next Actions section.

## Bridge work: approved candidate → completed scrum session → exported report
### Recommended minimal implementation
Add a code path that, when a candidate is approved, can (optionally) run the full SCRUM pipeline and export a report.

Options (pick one):
1) Extend the approve endpoint:
   - `POST /api/scrum/candidates/:id/approve?run=true&export=localReport`
2) Add a new endpoint:
   - `POST /api/scrum/candidates/:id/run` (runs to completion)

Behavior:
- Load candidate JSON (`getScrumCandidate(id)`)
- Start a SCRUM session using the candidate’s proposed title
  - Topic: `candidate.proposed.scrumTitle`
  - Participants: default `clerk/specialist/executive/archivist` (or existing weighted selection)
- Run stages to completion (advance until `finalStatus === "complete"`)
- Export report automatically:
  - Prefer `localReport` first, GitHub modes only if configured
- Return a response that includes:
  - `candidateId`, `scrumSessionId`, `reportPath`, `decision`, and `recommended_actions`

### Important: include candidate context inside the session
Right now the SCRUM check stage is hardwired to `Photon1c/pixeloffice` README.
For cooler-derived topics, the “check” stage should incorporate:
- cooler topic
- key utterances or the cooler markdown path
- KB snippets already present in the candidate JSON

Minimal acceptable approach:
- Put candidate context into `findings[]` so it appears in the report.

Better approach:
- Add a new `CheckOutput` field (or repurpose `findings`) specifically for “source_context”.

## Fix candidate mislabeling (optional but high value)
We already saw KB-based title mapping produce mismatched output (Cursor topic → “FSD Python Test Engine”).

Low-risk improvement:
- In `proposeScrumTitle()` / `proposeTasks()` (in `server/cooler/scrumCandidates.ts`), require stronger evidence before switching to the FSD template.
  - Example: only trigger FSD template if the topic itself mentions FSD, not just a weak KB snippet match.

## Acceptance criteria
- Approving a candidate can produce a completed SCRUM session and a report in one flow.
- Every exported SCRUM report includes at least one suggestion (recommended action), even for “close/no action”.
- For cooler-derived topics, the report shows the source topic and some context from the candidate.

## Quick manual test
1) Trigger a cooler run-turn to generate a candidate.
2) List candidates:
   - `GET /api/scrum/candidates?status=pending`
3) Approve and run:
   - `POST /api/scrum/candidates/:id/approve?run=true`
4) Confirm:
   - `docs/reports/<date>_scrum-<id>.md` exists
   - Report contains a Next Actions section with at least one bullet

## Key files to touch
- `server/cooler/scrumCandidates.ts` (approval flow, title heuristics)
- `server/index.ts` (endpoints and wiring)
- `server/scrum/scrumController.ts` (guarantee recommended actions, inject candidate context)
- `server/scrum/scrumExporter.ts` (already good, just needs non-empty recommendations)
