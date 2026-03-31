# Time + Tasks Backbone - Implementation Summary

## Overview

This document describes the v1 implementation of the Time + Tasks backbone for Pixel Office, based on the design in `~/.openclaw/workspace-main/docs/time_tasks_design.md`.

## New Database Tables

### events
Calendar events tracking *when* things happen.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(255) | Event title |
| type | VARCHAR(32) | Event type: `work`, `hobby`, `admin`, `self-care`, `social`, `health` |
| start_time | TIMESTAMP | Event start (timezone-aware) |
| end_time | TIMESTAMP | Event end |
| source | VARCHAR(64) | Source: `manual`, `github`, `task_system`, `calendar_sync` |
| notes | TEXT | Optional notes |
| links | JSON | Related URLs/identifiers |

### tasks_v2
Task management system tracking *what* you intend to do.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(255) | Task title |
| description | TEXT | Detailed context |
| status | VARCHAR(32) | `inbox`, `ready`, `in-progress`, `blocked`, `done`, `dropped` |
| priority | VARCHAR(8) | `P0`, `P1`, `P2` |
| timebox | VARCHAR(16) | Estimated duration: `25m`, `45m`, `1h`, etc. |
| due | DATE | Optional due date |
| tags | JSON | Array: `work`, `pixel-office`, `family`, `health`, `learning` |
| source | VARCHAR(64) | Source: `manual`, `github-issue`, `calendar` |
| links | JSON | Related URLs/identifiers |

### sessions
Work blocks tracking *what actually happened*.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| task_id | BIGINT | FK to tasks_v2 (nullable) |
| start_time | TIMESTAMP | Session start |
| end_time | TIMESTAMP | Session end (null if active) |
| notes | TEXT | What happened during this block |

## API Reference

### Database Compatibility

The APIs support both PostgreSQL and MySQL/MariaDB:
- PostgreSQL uses `$1, $2` placeholders and `RETURNING *`
- MySQL uses `?` placeholders and fetches via `insertId` after inserts

### Events API

```typescript
import { events } from './pixel_memory';

// Create an event
const event = await events.create({
  title: "Pixel Office testing",
  type: "work",
  start_time: new Date("2026-03-20T09:00:00"),
  end_time: new Date("2026-03-20T10:00:00"),
  notes: "Test new time tasks feature"
});

// List events for a day
const todayEvents = await events.listByDay(new Date());

// List events for a week
const weekEvents = await events.listByWeek(weekStartDate);

// Update an event
await events.update(event.id, { title: "Updated title" });

// Delete an event
await events.delete(event.id);
```

### Tasks API (v2)

```typescript
import { tasksV2 } from './pixel_memory';

// Create a task
const task = await tasksV2.create({
  title: "Upgrade pixel_office time tasks",
  description: "Implement event and session tracking",
  status: "inbox",
  priority: "P1",
  timebox: "2h",
  tags: ["work", "pixel-office"]
});

// List tasks by status
const readyTasks = await tasksV2.list({ status: "ready" });

// Filter by priority
const urgentTasks = await tasksV2.list({ priority: "P0" });

// Update task status
await tasksV2.update(task.id, { status: "in-progress" });

// Mark as done
await tasksV2.update(task.id, { status: "done" });
```

### Sessions API

```typescript
import { sessions } from './pixel_memory';

// Start a session (optionally linked to a task)
const session = await sessions.start({ task_id: task.id });

// End the session with notes
await sessions.end(session.id, {
  notes: "Completed the time tasks implementation"
});

// Get active session
const active = await sessions.getActive();

// List sessions for a day
const todaySessions = await sessions.listByDay(new Date());

// Get sessions for a specific task
const taskSessions = await sessions.listByTask(task.id);
```

### Derived Views

```typescript
import { generateTodaysPlan, generateTodaysLog, suggestEveningMicroSprint } from './pixel_memory';

// Generate today's plan with work and personal chapters
const plan = await generateTodaysPlan();
console.log(plan.chapters);    // ["Work", "Personal"]
console.log(plan.work.tasks);  // Work tasks for today
console.log(plan.personal.tasks); // Personal tasks for today

// Generate today's log (what happened)
const log = await generateTodaysLog();
console.log(log.narrative);    // "Completed 3 tasks. 120 minutes logged."
console.log(log.completedTasks);

// Suggest evening micro-sprint based on free time and hobby tasks
const sprint = await suggestEveningMicroSprint();
console.log(sprint.availableMinutes); // Minutes available after calendar
console.log(sprint.suggestedTasks);   // 1-2 tasks that fit
```

## Task Flow (GTD-inspired)

1. **Capture** → `inbox`: Quick capture with minimal fields
2. **Clarify** → `ready`: Refine title, timebox, priority, tags
3. **Commit** → `in-progress`: Start work, optionally create session
4. **Resolve** → `done` | `blocked` | `dropped`: Complete or document blockers

## Usage Example

```typescript
// Full workflow example
async function exampleWorkflow() {
  // 1. Capture a new task
  const task = await tasksV2.create({
    title: "Write documentation",
    source: "manual"
  });
  
  // 2. Clarify it
  await tasksV2.update(task.id, {
    status: "ready",
    priority: "P1",
    timebox: "45m",
    tags: ["work", "learning"]
  });
  
  // 3. Start working
  await tasksV2.update(task.id, { status: "in-progress" });
  const session = await sessions.start({ task_id: task.id });
  
  // 4. Complete work
  await sessions.end(session.id, {
    notes: "Wrote the time tasks implementation summary"
  });
  await tasksV2.update(task.id, { status: "done" });
  
  // 5. View today's log
  const log = await generateTodaysLog();
  console.log(log.narrative);
}
```

## UI Integration

A `TimeTasksPanel` component is available in the Pixel Office UI:

- Access via the **"Time + Tasks"** button in the Parameters sidebar
- **Tasks tab**: View, filter (by status), create, and update tasks
- **Events tab**: View and create calendar events for today
- **Plan tab**: See today's plan with work and personal chapters
- **Log tab**: See today's narrative and session history
- **Sessions**: Start/end sessions directly from task list

## Demo Script

Run the demo to test all functionality:

```bash
npm run time:demo
```

This creates sample events, tasks, and sessions, then outputs:
- Today's Plan with chapters and tasks
- Today's Log with narrative summary
- Evening Micro-Sprint suggestions

## Future Integration Points

The system is designed with these future integrations in mind:

- **GitHub issues → tasks**: Parse issue links, set `source = github-issue`
- **Tasks → calendar events**: Create focus blocks when starting `in-progress`
- **CLI/Skill interface**: Quick capture, today's plan, today's log commands

## Files Modified

- `src/types/index.ts` - Added Event, TaskV2, Session types
- `src/pixel_memory/schema.ts` - Added events, tasks_v2, sessions tables (schema v6)
- `src/pixel_memory/api.ts` - Added events, tasksV2, sessions APIs + derived views
- `src/pixel_memory/index.ts` - Exported new types and functions
- `src/pixel_memory/migrations.ts` - Fixed duplicate column handling
- `src/components/TimeTasksPanel.tsx` - New UI panel for time + tasks
- `src/components/PixelOffice.tsx` - Integrated TimeTasksPanel
- `scripts/time_tasks_demo.ts` - Demo/test script
- `package.json` - Added `time:demo` npm script
