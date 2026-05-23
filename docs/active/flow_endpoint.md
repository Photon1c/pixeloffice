# /api/flow Endpoint

**Created**: 2026-05-23  
**Location**: `server/index.ts:4742-4780`  
**Method**: GET  

## Purpose

Visual endpoint for mapping application state and debugging coherent flow issues.

## Response Schema

```json
{
  "timestamp": "2026-05-23T...",
  "office": {
    "activeAgents": 9,
    "conversationZones": ["kitchen", "conference"],
    "coolerActive": false,
    "scrumActive": false,
    "sleepMode": true,
    "vacationMode": false
  },
  "workflows": {
    "activeTasks": 0,
    "tasks": []
  },
  "movement": {
    "walkingAgents": 0,
    "sittingAgents": 9,
    "wanderingAgents": 0,
    "stuckAgents": 0
  },
  "features": {
    "coolerTalk": true,
    "testScrum": true,
    "agent2agent": true,
    "inventoryWorkflow": true,
    "chatOverlay": true
  }
}
```

## Usage

### cURL
```bash
curl http://localhost:3001/api/flow | jq
```

### Browser
```
http://localhost:3173/api/flow
```

### Frontend Integration
```typescript
const flowState = await fetch('/api/flow').then(r => r.json());
console.log('Active agents:', flowState.office.activeAgents);
console.log('Walking agents:', flowState.movement.walkingAgents);
```

## TODO: Flow Visualization Component

Create a React component that displays this data:

```tsx
function FlowVisualizer() {
  const [flow, setFlow] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetch('/api/flow').then(r => r.json());
      setFlow(data);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (!flow) return <div>Loading flow...</div>;
  
  return (
    <div className="flow-visualizer">
      <h3>🌊 Office Flow State</h3>
      <div className="metrics">
        <div>Active: {flow.office.activeAgents}</div>
        <div>Walking: {flow.movement.walkingAgents}</div>
        <div>Sitting: {flow.movement.sittingAgents}</div>
        <div>Stuck: {flow.movement.stuckAgents}</div>
      </div>
      <div className="zones">
        <h4>Active Zones</h4>
        {flow.office.conversationZones.map(zone => (
          <span key={zone} className="zone-badge">{zone}</span>
        ))}
      </div>
    </div>
  );
}
```

## Debugging Movement Issues

Use this endpoint to diagnose:

1. **Agents stuck**: Check if `movement.walkingAgents > 0` for extended period
2. **Animations not completing**: Monitor `workflows.activeTasks` during animations
3. **Zone conflicts**: Check `conversationZones` during cooler/scrum sessions
4. **Sleep mode impact**: Compare movement with `sleepMode` on/off

---

## Related Files

- `server/index.ts` - Endpoint implementation
- `src/components/PixelOffice.tsx` - Frontend state management
- `src/utils/agentLogic.ts` - Movement logic
- `docs/active/movement_bugs.md` - Known movement issues
