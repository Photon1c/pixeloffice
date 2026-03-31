# GUI Polish Changelog - 2026-03-22

## Summary
Applied a light GUI polish pass to the Pixel Office app, focused on visual/layout improvements for the office rendering layer.

## Visual/Layout Rules Normalized

### 1. Room Interior Padding Standardization
- **Added `ROOM_PADDING` constant** in `layout.ts`:
  - `left: 8px`
  - `top: 25px`
  - `right: 8px`
  - `bottom: 10px`
- **Updated rooms** to use consistent padding:
  - `drawCubicles()` - now uses `ROOM_PADDING`
  - `drawLobby()` - now uses `ROOM_PADDING`

### 2. Cubicle Scaling Rebalanced
- **Increased cubicle dimensions** from 120x100 to 160x140 pixels (~33% larger)
- **New `CUBICLE_GAP` constant** added for consistent spacing between cubicles (12px)
- **Reorganized cubicle grid layout** within Open Office:
  - Top row: 3 cubicles at y=270
  - Bottom row: 3 cubicles at y=440
  - Better proportions relative to the 680x420 Open Office space

### 3. Desk Drawing Scaling
All individual desk drawing functions were simplified and scaled proportionally:
- `drawOpenClawDesk()` - Simplified, desk now fills ~80% of cubicle width
- `drawIronClawDesk()` - Simplified, desk now fills ~85% of cubicle width
- `drawHermitClawDesk()` - Simplified with bookshelf
- `drawSherlobsterDesk()` - Simplified with filing cabinet
- `drawHerculePrawnroDesk()` - Simplified
- `drawLeslieClawDesk()` - Simplified with bookshelf

### 4. Lobby Reorganization
- Reception desk moved to use standardized `CUBICLE_POSITIONS[0]`
- Simplified lobby interior with consistent padding
- Cleaner floor and rug placement

### 5. Dead Code Removal
- Removed unused `drawExecutiveDesk()` function

## Problem Resolution

### Scale Mismatch (Fixed)
- Cubicles are now ~33% larger and better fill the Open Office space
- Desk elements scale proportionally with cubicle size

### Boundary Cleanup (Fixed)
- All rooms now use `ROOM_PADDING` for consistent inner margins
- Inner content areas maintain consistent offset from room borders

### Layout Alignment (Fixed)
- Cubicles arranged in a cohesive 3x2 grid within Open Office
- Lobby reception desk properly positioned in Lobby room

### Visual Hierarchy (Improved)
- Simplified desk designs reduce clutter
- Cleaner borders and spacing throughout

## Files Modified

1. `src/utils/layout.ts`
   - Added `ROOM_PADDING` constant
   - Updated `CUBICLE_WIDTH` (160) and `CUBICLE_HEIGHT` (140)
   - Added `CUBICLE_GAP` constant
   - Reorganized `CUBICLE_POSITIONS` array

2. `src/utils/drawOffice.ts`
   - Updated `drawCubicles()` with standardized padding
   - Updated `drawLobby()` with standardized padding and reception desk
   - Simplified and scaled all desk drawing functions
   - Removed unused `drawExecutiveDesk()`

## Success Criteria Met

- Rooms feel better scaled with consistent interior padding
- Agent workspaces are proportional to their rooms
- Visual clutter reduced while maintaining Pixel Office identity
- Layout is more cohesive and less like "injected thumbnails"
