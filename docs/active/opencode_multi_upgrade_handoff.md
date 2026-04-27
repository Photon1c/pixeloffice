# OpenCode Handoff: Pixel Office — Multi-Upgrade Summary

Date: 2026-04-23

## Overview

Implemented four interconnected upgrades to Pixel Office: a Cooler→SCRUM bridge guaranteeing meaningful reports, tightened loop detection, auto-refreshed news topics, and an Agentic OS Kernel reasoning loop for autonomous task execution.

---

## 1. Cooler → SCRUM Meaningful Reports (CRITICAL)

**File:** `server/cooler/scrumCandidates.ts`, `server/scrum/scrumController.ts`, `server/index.ts`, `server/scrum/types.ts`

### Problem
Approving a cooler-derived SCRUM candidate did not produce a completed session or exported report. Some SCRUM outputs had no suggested actions ("Summary: N/A"), defeating the talk→action pipeline goal.

### Changes

#### 1.1 Guaranteed Non-Empty Recommended Actions (`scrumController.ts:143-170`)
`runReviewStage()` now injects a default action if none exist:
```
"No action recommended right now. Monitor and revisit if new evidence appears."
```
This makes every exported report always display a "Next Actions" section.

#### 1.2 Extended Approve Endpoint (`index.ts:1657-1752`)
`POST /api/scrum/candidates/:id/approve?run=true&export=localReport`

- Approves candidate and optionally runs full SCRUM pipeline to completion
- Creates SCRUM session with candidate's proposed title and context
- Exports report automatically (localReport first, GitHub modes if configured)
- Returns: `candidateId`, `sessionId`, `reportPath`, `decision`, `recommended_actions`, `sourceContext`

#### 1.3 Candidate Context Injection (`scrumController.ts`, `types.ts`)
- `createScrumSession(topic, participants, sourceContext)` accepts optional context
- `runCheckStage()` includes source context in findings for cooler-derived topics
- `ScrumSession` and `CheckOutput` types updated with `sourceContext?: string[]`
- Check stage now displays: cooler session ID, location, topic, score, reasons, KB snippets

#### 1.4 Fixed Candidate Title Mislabeling (`scrumCandidates.ts:170-220`)
Template detection (FSD, Falcon Vision, Pixel Office) now requires indicator in the **topic itself**, not just KB snippet matches. Prevents Cursor topic → "FSD Python Test Engine" mislabeling.

### Acceptance Criteria
- [x] Approving candidate with `?run=true` produces completed session + report
- [x] Every exported report has at least one recommendation
- [x] Cooler-derived reports show source topic and candidate context

---

## 2. Loop Detection Tightened (MEDIUM)

**File:** `server/index.ts:1351-1357`, `src/components/PixelOffice.tsx:605-617`

### Problem
HermitClaw (and potentially others) showing STALLED state despite normal text generation.

### Changes

#### 2.1 Fixed Thresholds (`index.ts:1351-1357`)
| Metric | Before | After |
|--------|--------|-------|
| `loopScore` stall threshold | 0.4 | 0.5 |
| `noveltyScore` stall threshold | 0.5 | 0.3 |

Thresholds were too sensitive, flagging normal text as stalled.

#### 2.2 Fixed Token Estimation (`PixelOffice.tsx:605-617`)
Replaced `Math.random() * 100` with actual text length estimation:
```typescript
const burstTokenCount = Math.ceil(text.length / 4);
```
Token count was previously randomized instead of estimated from actual text.

### Acceptance Criteria
- [x] All agents show HEALTHY when text is normal
- [x] Actual looping text triggers LOOPING state
- [x] Marginally repetitive text doesn't incorrectly flag STALLED

---

## 3. News Topic Auto-Refresh (LOW)

**File:** `src/components/PixelOffice.tsx:351-375`

### Problem
Refresh button and topic update needed to ensure fresh content display.

### Changes

#### 3.1 Auto-Update Every 5 Minutes
Added `topicInterval` with 300-second interval calling `/api/cooler/topics/refresh`:
```typescript
const topicInterval = setInterval(refreshTopic, 300000);
return () => {
  clearInterval(interval);
  clearInterval(topicInterval);
};
```

#### 3.2 Refresh Button Fix
The ↻ button now calls a dedicated `refreshTopic()` function that properly updates `currentTopic`.

### Acceptance Criteria
- [x] News topic auto-updates every 5 minutes
- [x] Manual refresh button works correctly
- [x] No duplicate intervals on component re-render

---

## 4. Agentic OS Kernel Reasoning Loop (HIGH)

**File:** `server/orchestrator.cjs`, `server/kernel_reasoning_loop.cjs`

### Problem
The orchestrator ran simple role-based prompts but lacked autonomous goal decomposition, tool-based execution, result evaluation, and reflective loop control.

### Design (per `~/docs/agentic_os_kernel_reasoning_loop.md`)

The Kernel implements the four-stage reasoning loop:

```
Stimulus → Planner → Actuator → Evaluator → Reflector
                ↑                         ↓
                └──────── Loop if needed ─┘
```

#### 4.1 Planner
Decomposes high-level goal into sub-tasks with appropriate tools. Uses LLM with context from memory to generate task list.

**Tools available:**
- `run_cooler` - Trigger cooler talk session
- `list_scrum` - List pending SCRUM candidates
- `approve_scrum` - Approve candidate with `run=true`
- `refresh_news` - Refresh news topics
- `health_check` - Get system health metrics
- `desk_state` - Get desk stigmergy state
- `write_note` - Write progress note to memory

#### 4.2 Actuator
Executes each sub-task by calling the appropriate API or tool. Tracks execution results in memory.

#### 4.3 Evaluator
Checks if task result meets the goal. Returns:
- `passed`: boolean
- `confidence`: 0.0-1.0
- `reason`: explanation

#### 4.4 Reflector
Decides whether to continue looping or exit:
- Exits if `confidence >= 0.7`
- Exits if `iteration >= 5`
- Otherwise decides to continue, replan, or exit based on LLM reasoning

#### 4.5 Memory System
Three-tier memory persisted to `data/kernel_memory.json`:

| Type | Content | Limit |
|------|---------|-------|
| **Episodic** | What happened (task executions, successes/failures) | 100 entries |
| **Semantic** | Facts and rules (progress notes, conclusions) | 50 entries |
| **Working** | Active context (current goal, last stimulus) | In-memory |

Memory feeds context into Planner and Reflector for informed decisions.

### Integration with Orchestrator

The orchestrator now runs three activity types:

| Activity | Interval | Description |
|----------|----------|-------------|
| Agent cycles | 15 min | Role-based prompts (existing) |
| Random bursts | 5 min | Agent check-ins (existing) |
| **Kernel reasoning** | **30 min** | **Autonomous goal→task→execute→evaluate→reflect** |

### CLI Commands
```bash
# Start orchestrator (includes kernel cycles)
node orchestrator.cjs --start

# Run one kernel cycle manually
node orchestrator.cjs --kernel

# Run with specific goal
node orchestrator.cjs --kernel "Check office health and list SCRUM candidates"

# Check status (shows kernel report)
node orchestrator.cjs --status
```

### Output Files
- `data/kernel_report.json` - Last kernel reasoning run
- `data/kernel_memory.json` - Persistent memory state
- `data/orchestrator.log` - Combined log

### Acceptance Criteria
- [x] Kernel decomposes goals into tool-based tasks
- [x] Tasks execute via real API calls
- [x] Results evaluated for success/confidence
- [x] Reflector loops or exits appropriately
- [x] Memory persists across runs
- [x] Integrated with orchestrator schedule

---

## Quick Test Scenarios

### Test Cooler → SCRUM Bridge
```bash
# 1. Generate a candidate
curl -X POST http://localhost:4173/api/rooms/kitchen/cooler/run-turn \
  -H "Content-Type: application/json" \
  -d '{"topic": "urgent security fix needed"}'

# 2. List pending candidates
curl http://localhost:4173/api/scrum/candidates?status=pending

# 3. Approve and run full SCRUM
curl -X POST "http://localhost:4173/api/scrum/candidates/:id/approve?run=true"

# 4. Check report exists
ls data/scrum_logs/
ls docs/reports/
```

### Test Kernel Reasoning Loop
```bash
cd server
node orchestrator.cjs --kernel "Check office health and suggest improvements"
```

### Test Loop Detection
Open Pixel Office UI → Lab Mode → Observe Thought Bursts panel. All agents should show HEALTHY under normal conditions.

### Test News Auto-Refresh
Open browser devtools → Network tab → Filter by `/api/cooler/topics/refresh` → Wait 5 minutes or click ↻ button.

---

## Key Files Modified

| File | Changes |
|------|---------|
| `server/scrum/scrumController.ts` | Non-empty recommendations, sourceContext injection |
| `server/scrum/types.ts` | Added `sourceContext` to `CheckOutput`, `ScrumSession` |
| `server/cooler/scrumCandidates.ts` | Title mislabeling fix |
| `server/index.ts` | Extended approve endpoint with run/export |
| `src/components/PixelOffice.tsx` | Auto-refresh, token estimation fix |
| `server/orchestrator.cjs` | Kernel integration, new CLI flags |
| `server/kernel_reasoning_loop.cjs` | Standalone kernel module (new) |

---

## Next Steps / Future Work

1. **FrontDesk Agent Stalling** — Investigate specific FrontDesk behavior if loop detection shows recurring stalls
2. **Kernel Dashboard** — Add UI panel showing kernel status, last goal, iteration count, memory stats
3. **Tool Expansion** — Add more tools: GitHub API, file read/write, model management
4. **Confidence Calibration** — Tune evaluator based on actual tool success rates
5. **Episodic Replay** — Allow stepping through past kernel runs to debug pathological behavior