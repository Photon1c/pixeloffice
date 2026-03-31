# Pixel Office Privacy Patch - Implementation Summary

**Date:** 2026-02-13  
**Status:** Completed

---

## Overview

Implemented Sherlock's privacy model for Pixel Office, adding visibility states (public/private/offline) that control how agents are displayed in the virtual office. Also added viewMode hook, screen size fixes, collapsible parameters, and terminal endpoint.

---

## Files Modified

### 1. Backend: `server/index.ts`

**Changes:**
- Added `AgentVisibility` type (`"public" | "private" | "offline"`)
- Added `VisibilityConfig` interface
- Created `loadVisibilityConfig()` function that reads from JSON file
- Updated `/api/employee-status` to include `visibility` field for each agent
- Added `/api/agent-visibility` GET endpoint to read current config
- Added `/api/agent-visibility` POST endpoint to update visibility (for future use)
- Added `/command` endpoint to serve `computer_screen.html`

**Visibility file path:** `~/.openclaw/workspace-main/memory/logs/agent-visibility.json`

### 2. Frontend Types: `src/types/index.ts`

**Changes:**
- Added `AgentVisibility` type export
- Added `ViewMode` type (`"public" | "operator"`)
- Added optional `visibility` field to `Agent` interface
- Added optional `visibility` field to `EmployeeStatusResponse`
- Added `viewMode` to `DashboardConfig`

### 3. Frontend Rendering: `src/utils/drawOffice.ts`

**Changes:**
- Imported `AgentVisibility` from types
- Modified `drawBossOffice()` to accept optional `visibility` parameter
- Added `drawSherlockDoor()` function with three visual states:
  - **Public**: Brown door, brass handle, green indicator light (open)
  - **Private**: Purple-tinted door, "occupied" indicator light (closed)
  - **Offline**: Dark gray door, no light (lights off)
- Updated `drawStatusBar()` to accept `shouldRespectPrivacy` parameter:
  - When true (public view): respects privacy settings
  - When false (operator view): shows all agent details

### 4. Component Logic: `src/components/PixelOffice.tsx`

**Changes:**
- Added `viewMode` to `DEFAULT_CONFIG` (defaults to "public")
- Added `showParams` state for collapsible parameters panel
- Modified `fetchStatus()` to store visibility from API response
- Updated render loop to:
  - Pass Sherlock's visibility to `drawBossOffice()`
  - Skip drawing agents with `visibility === "offline"` when respecting privacy
  - Pass `shouldRespectPrivacy` to `drawStatusBar()` based on viewMode
- Added "Operator View" toggle in Dashboard
- Added "Terminal ↗" link to open `/command` endpoint
- Added collapsible Parameters panel (starts hidden, click "Show Parameters" to expand)

### 5. Layout: `src/utils/layout.ts`

**Changes:**
- Increased `CANVAS_WIDTH` from 1100 to 1200
- Increased `CANVAS_HEIGHT` from 720 to 800
- Increased `CUBICLE_WIDTH` from 180 to 200
- Increased `CUBICLE_HEIGHT` from 140 to 160
- Increased `CUBICLE_START_Y` from 230 to 250
- Updated `LOUNGE_AREA` to be wider and taller (280x520)
- Added more wander points for the larger space

### 6. Vite Config: `vite.config.ts`

**Changes:**
- Added `/command` proxy to `http://localhost:4173`

---

## Configuration File

**Location:** `~/.openclaw/workspace-main/memory/logs/agent-visibility.json`

```json
{
  "sherlock": {
    "visibility": "public",
    "note": "Default visibility"
  },
  "sherlobster": {
    "visibility": "public"
  },
  "hercule-prawnro": {
    "visibility": "public"
  }
}
```

Valid visibility values: `"public"`, `"private"`, `"offline"`

---

## Testing

1. **Build:** `npm run build` - Passed
2. **Server:** Started with `npm run dev:server` on port 4173
3. **API Verification:** 
   - Confirmed `/api/employee-status` returns visibility field
   - Tested with different visibility values in JSON file
4. **Terminal Endpoint:** `/command` serves `computer_screen.html` - Working
5. **Smoke Test:** Ran `tools/smoke_playwright.py` - Passed

---

## Behavior Summary

### Visibility States

| Visibility | Door | Agent | Status Bar |
|------------|------|-------|-------------|
| `public` | Open, green light | Visible, normal behavior | Working/Idle |
| `private` | Closed, purple light | Visible (or hidden per config) | "Busy" + "[Private]" |
| `offline` | Dark, no light | Not drawn | "Offline" (grayed out) |

### ViewMode

| ViewMode | Behavior |
|----------|----------|
| `public` | Respects privacy settings - hides offline agents, shows "Busy" for private |
| `operator` | Ignores privacy - shows all agents with real status |

### UI Features

- **Collapsible Parameters**: Click "Show Parameters" button to expand
- **Terminal Link**: Click "Terminal ↗" to open `/command` in new tab
- **Operator View Toggle**: Checkbox to switch between public/operator views

---

## Running the Application

```bash
# Start backend server (port 4173)
cd pixel_office
npm run dev:server

# Start frontend dev server (port 5173) - in another terminal
npm run dev

# Run smoke test
cd ../..
source lobsterenv/bin/activate
python3 tools/smoke_playwright.py
```

---

## Notes for Future LLM

- The visibility file is read on every API request (no caching)
- The POST endpoint exists but writes aren't automatic - meant for future dashboard integration
- Currently only Sherlock's office has the door visualization; other agents use default cubicle rendering
- The `/command` endpoint serves the terminal screen - can be enhanced to show real agent status
