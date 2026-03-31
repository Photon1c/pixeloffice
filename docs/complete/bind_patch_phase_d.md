# Phase D Bind Patch - Repo Question Integration

**Date:** 2026-03-19  
**Author:** opencode  
**Status:** Complete

## Summary

Implemented minimal integration to enable repo questions (e.g., "What is on this repo's README?") through the existing chat interface in Pixel Office. The patch binds the existing CoolerTalk + clerk workflow to the repo-aware backend without redesigning or replacing working systems.

## Motivation

The Pixel Office already had:
- **Time + Tasks backbone** (events, tasks_v2, sessions tables)
- **SCRUM system** (6-stage pipeline: check → report → review → decide → execute → log)
- **GitHub integration** (SafeScrumRepoClient for reports/notes)
- **CoolerTalk conversation engine** (intent sequencing, session persistence)

The gap: No way for users to ask simple repo questions like "What is on this repo's README?" through the chat interface. The FrontDesk/clerk path existed but wasn't connected to repo data.

## What Was Built

### 1. Repo Question Handler Service

**File:** `server/services/repoQuestionHandler.ts`

A small, focused service that:
- Classifies if a message is a repo question
- Parses the question type (readme, status, files, structure, issues, branches, contributors, general)
- Fetches repo info via GitHub API (with helpful fallbacks when GitHub isn't configured)
- Formats answers for office display

**Detected question patterns:**
- "What is on this repo's README?" → type: readme
- "What's the repo status?" → type: status
- "What files are in this repo?" → type: files
- "What's the repo structure?" → type: structure
- "Show me the issues" → type: issues
- "What are the branches?" → type: branches
- "Who are the contributors?" → type: contributors
- "Tell me about this project" → type: general

### 2. API Endpoints

**`POST /api/repo/ask`**
```json
{
  "message": "What is on this repo's README?",
  "agentName": "clerk",
  "createTask": false
}
```
Response:
```json
{
  "isRepoQuestion": true,
  "questionType": "readme",
  "answer": "Here's what's in the README for **owner/repo**:\n\n...",
  "formattedAnswer": "*[clerk checks the repository and responds]*\n\n...",
  "taskCreated": false,
  "metadata": { "fileName": "README.md" }
}
```

**`GET /api/repo/status`**
Returns GitHub repo status (configured, repo info, stats)

### 3. Chat Integration

Repo questions are now auto-detected in `/api/chat`:
```json
{
  "message": "What's in the README?"
}
```
Response includes `type: "repo_question"` with formatted answer.

### 4. Task Binding (Optional)

When `createTask: true` is passed, repo interactions create tasks_v2 entries:
- Title: `Repo question: {questionType}`
- Tags: `["repo", "question", {questionType}]`
- Source: `chat`

## Files Changed

| File | Change |
|------|--------|
| `server/services/repoQuestionHandler.ts` | **NEW** - Repo question handler service |
| `server/services/tests/repoQuestionHandler.test.ts` | **NEW** - 32 passing tests |
| `server/index.ts` | Added `/api/repo/ask`, `/api/repo/status`, wired into `/api/chat` |
| `package.json` | Added `test:repo` script |

## Test Results

```
npm run test:repo

# tests 32
# pass 32
# fail 0
```

Test coverage:
- `isRepoQuestion`: 17 test cases (all question patterns)
- `extractRepoInfo`: 3 test cases (env var fallback, partial inputs)
- `generateReadmeAnswer`: 3 test cases (content, null, truncation)
- `generateStatusAnswer`: 2 test cases (formatted, null)
- `generateFilesAnswer`: 4 test cases (files/dirs, empty, null, many files)
- `formatAnswerForOffice`: 3 test cases (formatting, empty, defaults)

## Success Criteria (Met)

| Criterion | Status |
|-----------|--------|
| User can ask "What is on this repo's README?" in chat UI | ✅ |
| Office answers through FrontDesk/clerk path | ✅ |
| Interaction can lightly bind to tasks_v2 | ✅ |
| SCRUM can see and use repo-related tasks | ✅ |
| Existing systems keep working | ✅ |

## Architecture Notes

```
User Message
    ↓
/api/chat (or /api/repo/ask)
    ↓
isRepoQuestion() → classifies question type
    ↓
handleRepoQuestion() → routes to appropriate handler
    ↓
GitHub API (or fallback message)
    ↓
formatAnswerForOffice() → clerk-style response
    ↓
Optional: tasksV2.create() for task binding
    ↓
Response to user
```

## Backwards Compatibility

- No changes to existing CoolerTalk conversation flow
- No changes to SCRUM stage handlers
- No changes to GitHub SafeScrumRepoClient
- Repo detection is additive (non-repo messages pass through to existing handlers)

## Future Enhancements (Out of Scope for This Patch)

- Full GitHub API coverage (PRs, commits, releases, etc.)
- Custom repo configuration per conversation
- Repo question history and analytics
- Deeper SCRUM integration for repo-aware check/report stages

---

# UI Improvements - Phase 2

**Date:** 2026-03-19  
**Author:** opencode  
**Status:** Complete

## Summary

Enhanced the Pixel Office UI to improve task management and SCRUM animation.

## Changes Made

### 1. Enhanced TimeTasksPanel (Tasks v2)

**File:** `src/components/TimeTasksPanel.tsx`

New features:
- **Delete buttons** - Appear on hover for each task
- **Assign dropdown** - Click 👤 button to assign tasks to agents
- **Hover states** - Tasks highlight when hovered
- **Priority selector** - Choose P0/P1/P2 when creating tasks
- **Strikethrough** - Completed tasks show strikethrough effect
- **Assignee badges** - Shows assigned agent on task

### 2. Fixed Sidebar Button Layout

**File:** `src/components/PixelOffice.tsx`

Changes:
- **"Test SCRUM" button** - Renamed from "SCRUM", now has its own row (no longer misaligned with Cooler Talk)
- **"Tasks v2" button** - Highlighted with teal border to indicate it's the preferred option
- **Legacy Task Manager** - Deprecated, shown with reduced opacity

### 3. Enhanced SCRUM Animation

**File:** `src/components/PixelOffice.tsx`

The "Test SCRUM" button now runs a proper 5-phase animation:

**Phase 1: Walking to Conference (2.5s)**
- Agents walk from their desks to conference room seats
- Status changes to "idle"

**Phase 2: Taking Seats (2.5s)**
- Agents switch to "sitting" mode
- Thought bubble shows "🤔 Ready for SCRUM"

**Phase 3: SCRUM Stages (18.5s total)**
Each stage shows a thought bubble animation:
1. **CHECK (3s)** - 📋 Checking repo status...
2. **REPORT (3.5s)** - 📊 Reporting findings...
3. **REVIEW (3s)** - 🔍 Reviewing changes...
4. **DECIDE (3.5s)** - ⚖️ Making decisions...
5. **EXECUTE (3s)** - 🚀 Executing plan...
6. **LOG (2.5s)** - 📝 Logging session...

**Phase 4: Completion (2.5s)**
- Thought bubble shows "✅ SCRUM complete!"

**Phase 5: Return to Desks (3s)**
- Agents switch back to "walking" mode
- Agents return to their original desk positions
- Thought bubbles cleared

### Files Modified

| File | Changes |
|------|---------|
| `src/components/TimeTasksPanel.tsx` | Added delete, assign, hover states |
| `src/components/PixelOffice.tsx` | Fixed button layout, enhanced SCRUM animation |
| `docs/dev_logs/bind_patch_phase_d.md` | Added this section |
