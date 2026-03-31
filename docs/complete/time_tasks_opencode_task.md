# OpenCode Task: Wire and Validate Time + Tasks Backbone in Pixel Office

## Objective

Finish wiring, testing, and lightly surfacing the **Time + Tasks v1 backbone** in Pixel Office. Use the existing schema, APIs, and docs to ensure that:

- `events`, `tasks_v2`, and `sessions` are fully functional end-to-end.
- Derived views (`generateTodaysPlan`, `generateTodaysLog`, `suggestEveningMicroSprint`) work and return useful data.
- There is a minimal but usable UI/flow to interact with tasks, events, and sessions.

## Key Docs & Files

Use and respect these as the source of truth:

- Design overview:  
  `~/apps/pixelworld/pixel_office/docs/complete/time_tasks_v1.md`

- Integration checklist (follow this as your plan):  
  `~/apps/pixelworld/pixel_office/docs/complete/time_tasks_ui_checklist.md`

- Demo / test script (keep it working or improve it, don’t remove it):  
  `~/apps/pixelworld/pixel_office/scripts/time_tasks_demo.ts`

- Pixel Memory APIs and schema (paths may already exist; confirm them):
  - `src/pixel_memory/schema.ts`
  - `src/pixel_memory/api.ts`
  - `src/pixel_memory/index.ts`
  - `src/pixel_memory/migrations.ts`
  - `src/types/index.ts`

## Tasks

1. **Schema & Migrations**
   - Ensure the database schema is at the expected version (v6) and includes:
     - `events`
     - `tasks_v2`
     - `sessions`
   - Verify columns and types match `time_tasks_v1.md`.
   - Resolve any legacy `tasks` table concerns:
     - Either migrate, alias, or clearly deprecate older task structures.
   - Confirm migrations run cleanly on a fresh database (no duplicate column errors).

2. **API Verification & Fixes**
   - Confirm the following APIs exist and behave as documented:
     - `events`: `create`, `listByDay`, `listByWeek`, `update`, `delete`.
     - `tasksV2`: `create`, `list` (with filters such as `status`, `priority`, `tags`), `update`.
     - `sessions`: `start`, `end`, `getActive`, `listByDay`, `listByTask`.
     - Derived: `generateTodaysPlan`, `generateTodaysLog`, `suggestEveningMicroSprint`.
   - Align their return shapes with the expectations in `time_tasks_v1.md`.
   - Update either the code or the docs so they match consistently.

3. **Demo Script: `time_tasks_demo.ts`**
   - Make sure `scripts/time_tasks_demo.ts` compiles and runs.
   - It should:
     - Create a sample event.
     - Create a sample task in `tasks_v2`.
     - Start and end a session for that task.
     - Print structured results from:
       - `generateTodaysPlan()`
       - `generateTodaysLog()`
       - `suggestEveningMicroSprint()`
   - Add an npm/pnpm script to `package.json` for easy running, e.g.:
     - `"time:demo": "ts-node scripts/time_tasks_demo.ts"` (or equivalent in this repo).

4. **UI / Workflow Integration (Minimal but Real)**
   - Implement or patch in minimal UI that allows:
     - Viewing tasks from `tasks_v2` (filterable at least by `status`).
     - Creating new tasks (captured into `inbox`).
     - Updating status (`inbox` → `ready` → `in-progress` → `done/blocked/dropped`).
     - Viewing today’s events (via `events.listByDay`).
     - Starting and ending a session from a task (or task detail view) using `sessions.start` / `sessions.end`.
   - Implement a simple view or panel for:
     - **Today’s Plan** (using `generateTodaysPlan()`), and
     - **Today’s Log** (using `generateTodaysLog()`).
   - It is okay if the UI is basic; correctness and clarity matter more than polish.

5. **Documentation Updates**
   - If actual behavior differs from `time_tasks_v1.md`, adjust the doc so it accurately reflects reality (or adjust the code if the spec is better).
   - In the main docs / README area for Pixel Office (where appropriate), add a short section:
     - What the Time + Tasks backbone is.
     - Where the APIs live (`pixel_memory` exports).
     - How to run the demo script and what to expect.

## Constraints & Style

- Prefer small, well-factored changes over large refactors.
- Preserve existing public APIs unless there is a clear bug or mismatch with the new design; if you must break something, note it in the docs.
- Keep names consistent with the existing codebase (`tasks_v2`, `events`, `sessions`, `pixel_memory`).

## Acceptance Criteria

- `pnpm` (or equivalent) can run the demo script without errors, and it prints sensible plan/log/sprint output for the current day.
- Creating tasks/events/sessions via the UI or scripting results in the expected DB records and shows up in the narrative views.
- The docs (`time_tasks_v1.md` and any added notes) accurately describe the shipped behavior.
- There is a clear path for future integration with GitHub issues → tasks and tasks → calendar focus blocks (no implementation required yet, just clean extension points).
