# Pixel Office Evening Summary

**Date:** March 31, 2026

## Changes Made

### 1. Backend Server Fixes
- Fixed `server/cooler/stigmergy.ts` to handle empty/null JSON files gracefully
- Added missing `/api/stigmergy/traces` and `/handoff/opencode-local-agents.json` endpoints to `server/index.ts`
- Fixed import paths in `server/index.ts` (roleModels, pixel_memory config duplicates)
- Fixed `server/roleModels.ts` import path for model_role_mapping.json

### 2. Frontend - Chat Button Fix
- Restored `ChatOverlay` component that was returning null
- Added full chat overlay UI with message history, input, and send button
- Added proper error handling for Ollama connection failures

### 3. Frontend - Show Parameters Links
- Restored 5 command links: Terminal, Sherlock CS, NightWatchauton, ClawGuard
- Added `commandLink` style to the styles object
- These are now gated behind LAB_MODE

### 4. Cooler Talk & Test SCRUM Buttons
- Added agent movement animation to kitchen/conference zones
- Cooler Talk: moves agents to kitchen positions, calls API, returns to desks after 8s
- Test SCRUM: moves agents to conference positions, returns to desks after 8s
- Added `getKitchenPosition()` and `getConferencePosition()` helper functions

### 5. Agent Action Card Restoration
- Restored full AgentActionCard from backup with:
  - Quick Actions dropdown (Fetch GitHub README, Generate SitRep, Nightly Report)
  - Workflow visualization with progress bar and step indicators
  - Task assignment section
  - Model selector dropdown for chat
  - Full chat interface with message history
- Added comprehensive `actionCardStyles` object

### 6. Public/Lab Mode Implementation
- Created `src/config/env.ts` helper exposing `PUBLIC_MODE` and `LAB_MODE`
- Modified Dashboard to gate content:
  - **LAB_MODE only:** Terminal, Sherlock CS, NightWatchauton, ClawGuard, Genealogy Lab, Admin Assistant, Stock Forecasts
  - **Both modes:** Live Mode, Show Names toggles
- Added "🔬 Lab Tools" section header in lab mode

## Environment Variables
- `VITE_PUBLIC_MODE=true` - enables public-only mode (hides lab tools)
- `VITE_LAB_MODE=true` - enables lab mode (shows all tools)
- Default behavior: lab-friendly if neither is set

## Files Modified
- `server/cooler/stigmergy.ts`
- `server/index.ts`
- `server/roleModels.ts`
- `src/config/env.ts` (new)
- `src/components/PixelOffice.tsx`

## Remaining Issues
- Criminology Lab remains hidden (was broken in backup)
- Ollama model may need to be available for chat functionality
- Sherlock CS (port 5190) is an external service not started by pixel-session.sh
