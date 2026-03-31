# Pixel Office Integration Upgrade - Resolution Summary

**Date:** 2026-03-16  
**Issue:** Chat with agents failing with 500 errors  
**Root Cause:** Multiple issues preventing backend server from starting and serving config

## Problems Identified

### 1. Server Module Import Error
**Symptom:** Backend server failed to start with:
```
SyntaxError: The requested module './dist/models/roleModels.js' does not provide an export named 'callChatModelForRole'
```

**Cause:** The `server/dist/models/roleModels.js` was compiled to CommonJS format but `index.ts` was importing it as ESM.

**Fix:** Rewrote `server/dist/models/roleModels.js` as ESM with proper exports:
```javascript
import modelRoleMapping from "../../model_role_mapping.json" with { type: "json" };

export function getRoleModelConfig(role) { ... }
export async function callModelForRole(role, prompt, options = {}) { ... }
export async function callChatModelForRole(role, messages, options = {}) { ... }
```

### 2. Missing Handoff Route
**Symptom:** `/handoff/opencode-local-agents.json` returned 404 or 500 errors

**Cause:** The route handler for `/handoff/opencode-local-agents.json` was defined in `workflow.ts` but not imported in `index.ts`

**Fix:** Added route handler directly to `server/index.ts`:
```typescript
app.get("/handoff/opencode-local-agents.json", (req, res) => {
  const handoffPath = "/home/sherlockhums/apps/pixelworld/.handoff/opencode-agents.json";
  if (fs.existsSync(handoffPath)) {
    const data = fs.readFileSync(handoffPath, "utf-8");
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } else {
    res.status(404).json({ error: "Handoff file not found" });
  }
});
```

### 3. Frontend Model List Not Updated
**Symptom:** Dropdown showed old models; "dash-squirrel" was default

**Fix:** Updated `src/components/PixelOffice.tsx`:
- Added `gemma-clerk` and `physics-assistant:latest` to `availableModels` array
- Added `useEffect` to auto-select the agent's configured primary model

```typescript
const availableModels = [
  { id: "gemma-clerk", name: "Gemma Clerk" },
  { id: "physics-assistant:latest", name: "Physics Assistant (Latest)" },
  // ... other models
];

useEffect(() => {
  loadAgentCards().then(cards => {
    const card = cards.find(c => c.id === agent.id);
    if (card) {
      setAgentCard(card);
      if (card.models?.primary?.name) {
        setSelectedModel(card.models.primary.name);
      }
    }
  });
}, [agent.id]);
```

### 4. TypeScript Build Error (Unrelated)
**Issue:** `charScale` declared but never used in `drawAgent.ts`

**Fix:** Removed unused variable declaration

## Configuration Verified

After fixes, the following model assignments are active:

| Agent | Role | Model |
|-------|------|-------|
| `frontdesk` | Receptionist | `gemma-clerk` |
| `openclaw` | Clerk | `gemma-clerk` |
| `sherlobster` | Clerk | `gemma-clerk` |
| `ironclaw` | Custodian | `gemma-clerk` |
| `leslieclaw` | Executive | `physics-assistant:latest` |
| `zeroclaw` | Specialist | `physics-assistant:latest` |
| `hercule-prawnro` | Specialist | `physics-assistant:latest` |
| `hermitclaw` | Archivist | `physics-assistant:latest` |

## Files Modified

1. `/home/sherlockhums/apps/pixelworld/.handoff/opencode-local-agents.json` - Agent config
2. `/home/sherlockhums/apps/pixelworld/pixel_office/server/dist/models/roleModels.js` - Fixed ESM exports
3. `/home/sherlockhums/apps/pixelworld/pixel_office/server/index.ts` - Added handoff route
4. `/home/sherlockhums/apps/pixelworld/pixel_office/src/components/PixelOffice.tsx` - Updated model list
5. `/home/sherlockhums/apps/pixelworld/pixel_office/src/utils/drawAgent.ts` - Fixed unused variable

## How to Start the App

```bash
# Terminal 1: Backend server
cd /home/sherlockhums/apps/pixelworld/pixel_office
npx tsx server/index.ts

# Terminal 2: Frontend dev server
cd /home/sherlockhums/apps/pixelworld/pixel_office
npm run dev
```

Or use the session script:
```bash
~/bin/pixel-session.sh
```

## Key Takeaways

1. The `.handoff` directory is the **source of truth** for agent configs
2. The frontend loads config from `/handoff/opencode-local-agents.json` via the Vite proxy
3. The backend serves this endpoint on port 4173
4. Both frontend and backend must be running for the app to work
5. When making config changes, ensure the server is restarted to pick up changes