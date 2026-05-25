# Pixel Office - Movement & Flow Bugs

**Date**: 2026-05-23  
**Status**: Active Investigation  

## Critical Movement Bugs

### 1. Agents Get "Bound" / Stuck in Movement Loops ❌

**Symptoms:**
- Agents appear to struggle to move when Test Delegation button is clicked
- Agents don't complete animations smoothly
- Movement appears jerky or frozen

**Root Cause Analysis:**
The `updateAgentPosition()` function in `src/utils/agentLogic.ts:343` only processes agents in specific modes:
```typescript
if (agent.mode !== "walking" && agent.mode !== "idle-wander" && agent.mode !== "standing") {
  return agent;  // Agent won't move!
}
```

**Problematic Code Patterns:**
1. Setting `mode: "sitting"` with a new `targetX/targetY` → agents won't move to target
2. Cleanup code that doesn't restore proper movement mode
3. Test conversation agents not returning to desks properly

**Affected Features:**
- ❌ Cooler Talk animation cleanup
- ❌ TEST SCRUM animation cleanup  
- ❌ Agent2Agent test conversation return
- ✅ General agent wandering logic (reduced to 5% wander-on-arrival, 3% schedule override)

**Fix Applied:**
- Cleanup code must use `mode: "walking"` (not "sitting") to enable movement back to desks
- Natural snap-to-sitting happens when distance < 4px in updateAgentPosition
- Wander rates reduced: `handleWanderLogic` 40% → 5%, `applyScheduleToAgents` 10% → 3%
  (`src/utils/agentLogic.ts:433`, `src/utils/agentLogic.ts:823`)

---

### 2. No Coherent Flow / User Journey ❌

**Symptoms:**
- Features work in isolation but don't connect smoothly
- User can't visualize the overall app flow
- No endpoint to map application state visually

**Missing Infrastructure:**
- `/flow` endpoint for visual app mapping
- Flow state machine documentation
- User journey tracking

**Recommendations:**
1. Create `/api/flow` endpoint that returns current app state
2. Add flow visualization component
3. Document state transitions between features

---

### 3. Animation Cleanup Issues ⚠️

**Features Affected:**
- Inventory Workflow Demo
- Cooler Talk
- TEST SCRUM
- Agent2Agent Test Conversation

**Issues:**
1. **Timeout leaks**: Multiple setTimeout calls without proper cleanup
2. **Mode inconsistency**: Setting wrong mode prevents movement
3. **State desync**: renderAgentsRef.current vs React state not in sync

**Fix Status:**
- ✅ Inventory Workflow: Fixed timeout array cleanup
- ✅ Cooler Talk: Fixed mode to "walking" for return
- ✅ TEST SCRUM: Fixed mode to "walking" for return
- ⚠️ Agent2Agent: Needs timeout tracking review

---

## Side Panel Audit

### Left Sidebar Buttons (All Present):
✅ Parameters toggle  
✅ Tasks panel  
✅ SCRUM panel  
✅ Chat overlay  
✅ Sleep Mode toggle  
✅ Vacation Mode toggle  
✅ Review Heat panel  
✅ Editor toggle  
✅ Inventory Workflow demo  
✅ **Agent2Agent Test** (new - triggers handleTestConversation)  
✅ Cooler Talk button  
✅ TEST SCRUM button  
✅ Model Health link  

### Right Panel Components (All Present):
✅ StabilityMonitor (CPU/Memory/FPS)  
✅ TSAHealthPanel (agent activities)  
✅ AgentIssueMonitor (with Test Conversation button)  
✅ YouTubePlayer  

**Note**: AgentIssueMonitor already has working Test Conversation functionality. Left sidebar button provides quick access to same `handleTestConversation()` function.

---

## Movement Logic Flow

```
Agent Movement States:
┌─────────────┐
│   sitting   │ ← Final state when at desk
└──────┬──────┘
       │
       │ mode change
       ↓
┌─────────────┐     distance < 4px    ┌─────────────┐
│   walking   │ ────────────────────→ │   sitting   │
└──────┬──────┘                       └─────────────┘
       │
       │ updateAgentPosition() processes
       ↓
[Moves toward targetX, targetY]
```

**Critical Rule**: Only "walking", "idle-wander", "standing" modes are processed by updateAgentPosition()

---

## Testing Checklist

- [ ] Cooler Talk: Agents move to kitchen → conversation → return to desks
- [ ] TEST SCRUM: Agents move to conference → SCRUM runs → return to desks
- [ ] Agent2Agent: Two agents meet → conversation → return to desks
- [ ] Inventory Workflow: Animation completes without hanging
- [ ] Chat button: Opens overlay with current topic displayed
- [ ] General wandering: Agents move naturally when idle

---

## Recommended Next Steps

1. **Add `/api/flow` endpoint** - Visualize current app state
2. **Create flow diagram component** - Show feature connections
3. **Add movement debugging overlay** - Show agent modes/targets in real-time
4. **Document state machine** - Formal spec for agent states
5. **Add telemetry** - Track animation completion rates

---

## Files Modified

- `src/components/PixelOffice.tsx` - Animation cleanup fixes
- `src/components/InventoryWorkflowDemo.tsx` - Timeout array cleanup
- `src/utils/agentLogic.ts` - Movement logic (reference only)

---

## Build Status

✅ Production build successful  
✅ TypeScript compilation passed  
⚠️ Pre-existing LSP warnings (targetX typing) - not blocking
