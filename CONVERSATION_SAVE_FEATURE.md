# Conversation Save Functionality

## Summary
Added save button to Agent2Agent test panel that exports conversation transcripts as .md files.

## Changes Made

### Frontend (`src/components/StabilityMonitor.tsx`)
1. Added `ConversationData` interface for conversation export
2. Added state variables:
   - `conversationData`: Stores conversation data for saving
   - `saveStatus`: Tracks save operation status ('idle' | 'saving' | 'saved' | 'error')
3. Added `enableSaveConversation` window handler to receive conversation data from parent
4. Added `saveConversation()` function that POSTs to `/api/conversation/save`
5. Added save button next to conversation title with status indicators

### Backend (`server/index.ts`)
1. Added POST `/api/conversation/save` endpoint
2. Endpoint creates CoolerSession from test conversation data
3. Saves to:
   - `data/cooler_sessions/` (JSON)
   - `docs/cooler/` (Markdown)
4. Uses existing `createCoolerSession`, `exportSession`, and `persistSession` functions

### Usage
1. Click "Test" button in Agent2Agent panel
2. Wait for 8-turn conversation to complete
3. "Save" button appears next to conversation title
4. Click "Save" to export transcript
5. File saved to `docs/cooler/{date}_{sessionId}.md`

## File Locations
- Markdown transcripts: `docs/cooler/`
- JSON sessions: `data/cooler_sessions/`
- Format: Standard Cooler Talk markdown with session metadata

## Testing
- Build successful (vite build)
- Server endpoint registered
- UI button integrated with existing test conversation flow
