# Time + Tasks Backbone – Pixel Office Integration Checklist

This checklist guides an OpenCode / dev-agent through finishing and validating the Time + Tasks v1 backbone in Pixel Office.

Related doc: `time_tasks_v1.md`

---

## 1. Database & Migrations

- [ ] Confirm the latest schema version (v6) is applied in the dev database.
  - [ ] Verify `events`, `tasks_v2`, and `sessions` tables exist with the columns described in `time_tasks_v1.md`.
  - [ ] Check that `tasks_v2` is the canonical task table going forward (and decide what to do with any legacy `tasks` table: migrate, alias, or deprecate).
- [ ] Run migrations on a clean database and ensure there are no duplicate-column or conflict errors.
- [ ] Optionally, add a short README note to the migrations/docs indicating that `tasks_v2` supersedes older task structures.

---

## 2. Pixel Memory API Wiring

- [ ] Confirm that `src/pixel_memory/api.ts` exports fully working APIs for:
  - [ ] `events` (create, listByDay, listByWeek, update, delete)
  - [ ] `tasksV2` (create, list with filters, update)
  - [ ] `sessions` (start, end, getActive, listByDay, listByTask)
  - [ ] Derived views: `generateTodaysPlan`, `generateTodaysLog`, `suggestEveningMicroSprint`
- [ ] Confirm `src/pixel_memory/index.ts` re-exports these APIs for use in the rest of Pixel Office.
- [ ] Align the actual return types/structures of derived views with what the docs describe (e.g., plan/log shapes). Update docs or code so they match.

---

## 3. UI & Workflow Integration

**Goal:** make `events`, `tasks_v2`, and `sessions` visible and usable from the Pixel Office UI.

### 3.1 Tasks

- [ ] Identify any existing task-related UI or flows that still use an older task model.
  - [ ] Point these to `tasks_v2` instead, or create new views specifically for `tasks_v2`.
- [ ] Implement or update a **Task List** view that supports:
  - [ ] Filtering by `status` (inbox, ready, in-progress, blocked, done, dropped).
  - [ ] Filtering by priority (P0/P1/P2) and tags (e.g., work, pixel-office, health).
  - [ ] Quick creation of new tasks (at minimum: title + optional source) landing in `inbox`.
- [ ] Ensure there are clear controls to move tasks between states (`inbox` → `ready` → `in-progress` → `done/blocked/dropped`).

### 3.2 Events (Calendar)

- [ ] Add a simple **Today / Week** events view using the `events` API:
  - [ ] Display events for the current day ordered by time.
  - [ ] Optionally show a week summary (even a simple list grouped by day).
- [ ] Provide a minimal UI for creating/updating events:
  - [ ] Title, type, start/end time, optional notes.
- [ ] (Optional) Expose an easy way to link an event to a task via `links`.

### 3.3 Sessions (Focus Blocks)

- [ ] From a task detail or list item, allow starting a **session**:
  - [ ] Call `sessions.start({ task_id })`.
  - [ ] Visually indicate that a session is active, and for which task.
- [ ] Provide a way to **end** the active session:
  - [ ] Call `sessions.end(session.id, { notes })`.
  - [ ] Store quick summary notes (what happened, next steps).
- [ ] Ensure `sessions.getActive()` is used to avoid multiple overlapping active sessions (or handle that case explicitly).

---

## 4. Narrative Views (Plan & Log)

- [ ] Implement a **Today’s Plan** view backed by `generateTodaysPlan()`:
  - [ ] Show high-level chapters (e.g., Work, Personal) if returned by the helper.
  - [ ] Show the subset of tasks proposed for today, with statuses/links.
- [ ] Implement a **Today’s Log** view backed by `generateTodaysLog()`:
  - [ ] Display the narrative summary (e.g., "Completed 3 tasks. 120 minutes logged.").
  - [ ] List completed tasks and key sessions.
- [ ] Optionally, surface **Evening Micro-Sprint** suggestions via `suggestEveningMicroSprint()`:
  - [ ] Display available minutes.
  - [ ] Display 1–2 suggested hobby/learning tasks that fit.

---

## 5. Developer Test Script

- [ ] Add a small test/demo script that:
  - [ ] Creates a few sample events, tasks, and sessions.
  - [ ] Logs the output of `generateTodaysPlan()`, `generateTodaysLog()`, and `suggestEveningMicroSprint()` to the console.
- [ ] Ensure this script can be run easily (e.g., via `pnpm test:time-tasks` or a similar npm script).
- [ ] Use this as a regression check when making changes to Pixel Memory.

---

## 6. Documentation

- [ ] Confirm `time_tasks_v1.md` accurately reflects the current implementation. If the code and doc diverge, update the doc.
- [ ] In the main Pixel Office docs index (if present), add a short pointer/section for:
  - Time + Tasks backbone overview.
  - Where to find the API (`pixel_memory` exports).
  - How to run the test script.

Once all boxes are checked, Pixel Office should have a fully wired v1 Time + Tasks backbone: tasks and events visible in the UI, sessions tracked, and narrative views available for daily planning and review.
