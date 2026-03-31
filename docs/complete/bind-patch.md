Implement a minimal Phase D kaizen patch for Pixel Office.

GOAL
Bind the existing working chat + clerk workflow to the existing repo-aware backend, Time + Tasks MySQL-backed system, and SCRUM flow so the office can answer repo questions like:

- "What is on this repo's README?"
- "What changed in the README?"
- "What repo task should we do next?"

IMPORTANT
This is a MINIMAL INTEGRATION PATCH.
Do NOT reinvent the wheel.
Do NOT redesign the chat system.
Do NOT replace working GitHub/SCRUM/export flows.
Do NOT introduce new safety wrappers or new abstraction layers unless absolutely necessary.
Prefer reusing existing routes, services, task APIs, and repo helpers.

INTENT
We already have:
- a working chat interface
- FrontDesk / clerk routing behavior
- working repo-aware flows
- Time + Tasks backbone (events / tasks_v2 / sessions)
- SCRUM stages and export modes
- MySQL/Postgres support through existing APIs

We now want a small binding layer so repo questions can:
1. read repo state through existing mechanisms
2. optionally map to tasks_v2
3. optionally surface into SCRUM follow-up work
4. remain visible in the current chat workflow

PRIMARY USER STORY
A user asks in chat:
"What is on this repo's README?"

Expected behavior:
- FrontDesk/clerk path handles it using the existing chat workflow
- system retrieves README content or summary using the existing repo/GitHub path
- response is returned in chat
- optionally, if configured, the interaction can create or update a related task in tasks_v2
- no extra user confirmations for trusted configured workflows

MINIMAL SCOPE

PART 1 — REPO QUESTION HANDLER
Add a small repo-question handler that can answer read-only repo questions through the existing chat path.

Support at least:
- README summary
- README raw content preview or excerpt
- repo status summary if already available from existing code

Do NOT build a general agent framework.
Do NOT add a new planner.
Just add a narrow handler for repo-information requests.

PART 2 — TASK BINDING
When a repo question is answered, add OPTIONAL lightweight task linkage.

Example:
- if the user asks a repo question and no related task exists, optionally create a task such as:
  "Review README content"
- if a related task exists, optionally attach/update metadata instead of duplicating

Keep this simple.
Reuse tasks_v2 APIs and existing REST endpoints.
No schema redesign unless absolutely required.
If task metadata is needed, keep it tiny and backwards-compatible.

PART 3 — SCRUM BINDING
Allow repo-related tasks to appear naturally in existing SCRUM flow.

Minimal target:
- CHECK can read active repo-related tasks
- REPORT can summarize them
- DECIDE can choose a repo-related follow-up action
- EXECUTE can start a linked session or mark a task in progress using existing task/session APIs

Do NOT redesign SCRUM stages.
Do NOT add new stage types.
This is a small data plumbing patch.

IMPLEMENTATION GUIDELINES

1. Reuse existing code first
Before adding anything, inspect and reuse:
- existing chat request path
- existing clerk/front desk routing
- existing repo/GitHub helper code
- existing tasks/events/sessions APIs
- existing SCRUM controller and stage handlers

2. Prefer narrow utilities over new architecture
Acceptable:
- one small helper for repo question classification
- one small helper for task linkage
- small additions to SCRUM CHECK / REPORT / EXECUTE
Not acceptable:
- new orchestration framework
- new policy wrapper
- new generic agent subsystem

3. Keep read-path and write-path separate
- repo question answering = read path
- task creation/update = optional write path
- SCRUM task/session updates = existing operational path

4. Backwards compatibility
- existing chat flow must still work
- existing local/GitHub SCRUM export modes must still work
- TimeTasksPanel must still work
- no regressions to current working flows

SUGGESTED DELIVERABLES

A. CHAT / REPO QUESTION SUPPORT
Add minimal classification for repo questions such as:
- readme
- repo status
- repo docs summary

If the question targets README:
- fetch README via existing repo source
- return:
  - concise summary
  - optional excerpt
  - source metadata if already available

B. TASK LINKAGE
On successful repo-answer flow, optionally:
- create a task with a stable title pattern, e.g.
  "Review README for <repo>"
or
- find/update an existing repo-related task

Keep duplication low.
Prefer idempotent behavior if possible.

C. SCRUM LINKAGE
Patch existing SCRUM stage handlers so they can consume repo-related tasks:
- CHECK: include active repo tasks
- REPORT: mention repo task summary
- EXECUTE: start session or update task status when relevant

D. TESTS
Add only the minimum tests needed:
- repo README question returns answer
- task linkage works without duplicating endlessly
- SCRUM CHECK sees repo-related task
- no regression to current export flow

POSSIBLE FILES TO MODIFY
These are examples only; reuse whatever already exists if better.

- server/chat/... existing route or handler
- server/services/... existing repo or GitHub helper
- server/tasks/... or existing REST-backed task service
- server/scrum/... existing stage handlers
- docs/active/... phase note or patch note

AVOID
- rewriting FrontDesk/clerk flow
- adding confirmation prompts for trusted repo workflows
- creating a new Safe* wrapper
- introducing generic memory/planner abstractions
- broad schema changes
- overbuilding

SUCCESS CRITERIA
This patch is successful if:
1. A user can ask in the existing chat UI:
   "What is on this repo's README?"
2. The office answers through the working FrontDesk/clerk path
3. The interaction can lightly bind to tasks_v2
4. SCRUM can see and use those repo-related tasks
5. Existing systems keep working with minimal code churn

OUTPUT FORMAT
Please return:
1. minimal implementation plan
2. exact files to patch
3. exact code changes
4. any tiny schema/API additions if truly required
5. short regression test plan

Optimize for minimal kaizen changes, not redesign.
