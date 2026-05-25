# TODO: Restore Missing Features

## 1. Starbucks Inventory Test Button ✅ RESTORED

**Status**: IMPLEMENTED  
**Location**: Left sidebar (orange button)  
**Integration**: Emits routes to ~/tools/router-visualizer  

**Features**:
- ☕ "Starbucks Inventory Test" button in left sidebar
- Triggers inventory workflow animation automatically
- Emits agent routing events to router visualizer
- Route flow: frontdesk → openclaw → zeroclaw → ironclaw → sherlobster

**To Test**:
```bash
# Terminal 1: Start router visualizer
cd ~/tools/router-visualizer
python app.py
# Open http://localhost:5006

# Terminal 2: Start Pixel Office (if not running)
cd ~/apps/pixelworld/pixel_office
npm run dev

# Click the orange "☕ Starbucks Inventory Test" button
# Watch routes animate in the visualizer!
```

---

## 2. Tiny-Router Integration ⚠️ PARTIAL

**Status**: Documented but not fully integrated  
**References**: 
- `docs/active/may_upgrade2.md` mentions "tiny-router app"
- `CHANGELOG_orchestrator.md` has tiny-router evaluation section
- Router visualizer exists at `~/tools/router-visualizer`

**Description**: tiny-router is a compact multi-head text classifier for routing decisions  

**Current Integration**:
- ✅ Cooler Talk, TEST SCRUM, Agent2Agent, and the Inventory Workflow demo emit routes to the router visualizer app at `~/tools/router-visualizer` (HTTP endpoint `http://localhost:5007/api/route`)
- ❌ tiny-router classification not integrated in decision flow

**Action Required**:
- [ ] Locate tiny-router library/code
- [ ] Integrate with agent routing decisions
- [ ] Add UI indicator for router classification confidence

---

## 2. Tiny-Router Integration ❌ MISSING

**Status**: Documented but not integrated  
**References**: 
- `docs/active/may_upgrade2.md` mentions "tiny-router app"
- `CHANGELOG_orchestrator.md` has tiny-router evaluation section

**Description**: tiny-router is a compact multi-head text classifier for routing decisions  

**Action Required**:
- [ ] Locate tiny-router code/library
- [ ] Integrate with agent routing logic
- [ ] Add UI indicator for router status

---

## 3. /flow Endpoint ⚠️ PARTIAL

**Status**: Backend snapshot implemented, frontend visualizer pending  
**Purpose**: Visualize app state and user journey  

**Current Implementation**:
```typescript
// Server endpoints
// 1) POST /api/flow/state  - frontend pushes a lightweight snapshot
// 2) GET  /api/flow        - returns latest office snapshot

// Example response shape from GET /api/flow
{
  timestamp: string,
  office: {
    activeAgents: number,
    conversationZones: string[],
    coolerActive: boolean,
    scrumActive: boolean,
    sleepMode: boolean,
    vacationMode: boolean,
    updatedAt: string | null,
  },
  movement: {
    walkingAgents: number,
    sittingAgents: number,
    wanderingAgents: number,
    stuckAgents: number,
  },
  workflows: {
    activeTasks: number,
    tasks: Array<{
      id: string,
      type: string,
      status: string,
      currentAgent: string,
    }>,
  },
  moods: Record<string, string>, // agentId -> emoji mood
  features: {
    coolerTalk: boolean,
    testScrum: boolean,
    agent2agent: boolean,
    inventoryWorkflow: boolean,
    chatOverlay: boolean,
  },
}
```

**Action Required**:
- [x] Add `/api/flow` endpoint to `server/index.ts` (plus `/api/flow/state` publisher)
- [ ] Create flow visualization component in frontend
- [ ] Document flow state machine

---

## 4. Agent Movement Constraints ⚠️ INVESTIGATING

**Symptoms**: 
- Agents appear "bound" to workspaces
- Movement not smooth during animations
- Buttons not triggering proper movement

**Current Hypothesis**:
1. Sleep mode may be limiting movement frequency
2. Wander logic may be interfering with targeted movement
3. Mode transitions (walking → sitting) happening too early

**Files to Audit**:
- `src/utils/agentLogic.ts:updateAgentPosition()` - boundary constraints
- `src/utils/agentLogic.ts:handleWanderLogic()` - may override targeted movement
- `src/components/PixelOffice.tsx` - render loop movement logic

**Action Required**:
- [ ] Add movement debugging overlay
- [ ] Log agent mode changes
- [x] Wander logic reduced: `handleWanderLogic` 40% → 5%, schedule override 10% → 3%
- [ ] Verify sleep mode isn't preventing movement

---

## 5. Button Functionality Issues ❌

**Reported**: Buttons not working properly  

**Buttons to Test**:
- [ ] Cooler Talk - agents move to kitchen?
- [ ] TEST SCRUM - agents move to conference?
- [ ] Agent2Agent Test - conversation starts?
- [ ] Inventory Workflow - animation plays?
- [ ] Test Delegation (in Agent2Agent panel) - triggers?

**Action Required**:
- [ ] Test each button manually
- [ ] Check console for errors
- [ ] Verify event handlers are attached
- [ ] Ensure state updates trigger re-renders

---

## Priority Order

1. ✅ **FIXED**: Agent movement constraints — wander rates reduced to prevent excess roaming
2. **HIGH**: Add /flow endpoint for debugging
3. **MEDIUM**: Restore Starbucks inventory test
4. **MEDIUM**: Integrate tiny-router
5. **LOW**: Button UI polish

---

## Notes

- User emphasized: "do not delete critical elements on the side panels"
- User wants: "consolidated spaces" and "fix dead spaces"
- All existing functionality must be preserved
- New features should be added without removing old ones
