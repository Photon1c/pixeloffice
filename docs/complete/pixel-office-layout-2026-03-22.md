# Pixel Office Layout & Design Documentation

**Date:** 2026-03-22  
**Project:** Pixel Office GUI

---

## Overview

This document describes the Pixel Office layout after the GUI polish session. The office is organized into distinct rooms/zones, each designed for specific agents and purposes.

---

## Layout Map

```
Top Row (y:10, height: 200px):
┌─────────┬─────────┬───────────┬───────────┬───────────┐
│Executive│ Sherlock│ Specialist │Conference │ Kitchen   │
│  x:10   │ x:190  │  x:390    │  x:680   │  x:920   │
│ 180x200 │180x200 │  280x200  │  230x200  │  260x200  │
└─────────┴─────────┴───────────┴───────────┴───────────┘

Bottom Row (starting y:220):
┌─────────┬─────────┬───────────┬────────────┬───────────┬───────────┐
│ Lobby   │ Gym     │ Sherlobster│ Open Office│War Room  │ Archives  │
│ 200x100 │120x100 │ 180x140   │  340x280   │ 260x200  │ 260x200   │
│ x:10    │ x:10   │  x:140   │   x:330   │  x:920   │  x:920   │
│ y:220   │ y:330  │  y:330   │   y:220   │  y:220   │  y:430   │
│         ├─────────┤           │            │           │           │
│         │         │           │            ├─────────────────────┤
│         │         │           │            │Mission Control       │
│         │         │           │            │ x:680, y:450         │
│         │         │           │            │ 230x180              │
└─────────┴─────────┴───────────┴────────────┴─────────────────────┘
```

---

## Room Specifications

### Top Row Rooms

| Room | Position (x,y) | Size (w×h) | Zone ID | Description |
|------|----------------|------------|---------|-------------|
| Executive Suite | 10, 10 | 180×200 | exec_suite | LeslieClaw's office - warm gray walls, green accent, wood floor |
| Sherlock Office | 190, 10 | 180×200 | sherlock_office | Sherlock's analysis room - cream walls, navy accent, herringbone floor |
| Specialist Suite | 390, 10 | 280×200 | specialist_suite | ZeroClaw's lab - multiple monitors, status lights |
| Conference Room | 680, 10 | 230×200 | conference | Meeting room with whiteboard and oval table |
| Kitchen | 920, 10 | 260×200 | kitchen | Break room with fridge, coffee machine, water cooler |

### Bottom Row Rooms

| Room | Position (x,y) | Size (w×h) | Zone ID | Description |
|------|----------------|------------|---------|-------------|
| Lobby | 10, 220 | 200×100 | lobby | Reception area with FrontDesk |
| Gym | 10, 330 | 120×100 | gym | Wellness area with exercise equipment |
| Strategy Room | 140, 330 | 180×140 | sherlobster | Sherlobster's council room - oval table, kanban boards |
| Open Office | 330, 220 | 340×280 | open_office | Open workspace for OpenClaw and IronClaw |
| War Room | 920, 220 | 260×200 | war_room | Hercule's investigation room - monitors, whiteboard |
| Mission Control | 680, 450 | 230×180 | mission_control | Monitoring center with screens |
| Archives | 920, 430 | 260×200 | archives | HermitClaw's record room - timeline, bookshelf |

---

## Agent Assignments

| Agent | Room | Desk Position (x,y) | Desk Index |
|-------|------|-------------------|------------|
| FrontDesk | Lobby | 40, 250 | 0 |
| OpenClaw | Open Office | 350, 280 | 1 |
| IronClaw | Open Office | 500, 280 | 2 |
| HermitClaw | Archives | 980, 480 | 3 |
| LeslieClaw | Executive | 50, 60 | 4 |
| Sherlock | Sherlock Office | 240, 60 | 5 |
| ZeroClaw | Specialist | 480, 60 | 6 |
| Hercule Prawnro | War Room | 990, 270 | 7 |
| Sherlobster | Strategy Room | 170, 370 | 8 |

---

## Room Features

### Executive Suite (LeslieClaw)
- Soft gray walls with muted green accent
- Light oak floor with wood grain pattern
- Small rug under desk
- Large wooden desk with laptop, keyboard, mug
- Guitar stand with guitar silhouette
- Tall plant (right side)
- Bookshelf with colorful books
- Floor lamp with warm lighting

### Sherlock Office
- Soft cream walls
- Deep navy accent wall behind desk
- Herringbone hardwood floor
- Dark wood desk with leather blotter
- Fountain pen in stand
- Open notebook with notes
- Side table with carafe and glass
- Chocolate plate
- Framed diagrams on navy wall
- Abstract painting on left wall
- Warm lamp lighting

### Specialist Suite (ZeroClaw)
- Dark monitoring walls
- Central desk with 3 tall monitors
- Status lights on wall (green, yellow, blue)
- Graph display on right wall
- Load indicators

### War Room (Hercule)
- Dark charcoal walls
- Blue accent wall
- Large investigation desk
- 3 monitors for investigation
- Whiteboard with decision tree diagram
- Timeline with colored markers
- Pinboard with colored notes (yellow, red, green)
- Evidence folder on desk

### Strategy Room (Sherlobster)
- Warm cream walls
- Wood accent wall (top)
- Light floor
- Oval table with 4 chairs
- Kanban board on right wall (3 columns)
- Roadmap timeline on left wall
- Warm ambient lighting

### Kitchen
- Dark walls
- Fridge (right side)
- Counter along bottom
- Coffee machine on counter
- Water cooler (center-left)
- Snack cabinet above counter

### Mission Control
- Dark monitoring walls
- 3 large monitoring screens with graphs
- Control panel at bottom with status lights
- 5 colored status indicators
- Indicator buttons

### Open Office
- Charcoal carpet
- 2 large desk areas with monitors
- Open workspace configuration

### Archives
- Cream walls
- Honey hardwood floor (striped)
- Timeline strip on wall (2022-2026)
- Tall bookshelf with books
- Reading desk with lamp

### Lobby
- Reception desk area
- Hardwood floor with stripe pattern
- Charcoal rug

### Gym
- Exercise mat (centered)
- Dumbbells
- Towel rack

---

## Visual Elements

### Clock
- Position: Bottom-right (x: 1150, y: 720)
- Digital display showing HH:MM:SS
- Green LED-style text (#00ff88)

### Plants
- Single plant near lobby area (x: 270, y: 240)

### Color Palette

| Element | Color |
|---------|-------|
| Background | #050814 |
| Floor | #0a1023 |
| Walls | #1b2333 |
| Wall Border | #2a3548 |
| Status Working | #00ff88 |
| Status Idle | #ff4b4b |
| Hardwood Floor | #d4b896 |

---

## File Structure

- `src/utils/layout.ts` - Room definitions and agent positions
- `src/utils/agentLogic.ts` - Agent initialization and behavior
- `src/utils/drawOffice.ts` - Room rendering functions

---

## Notes

- All rooms use relative positioning from `ROOMS` object
- Draw functions use `room.x`, `room.y`, `room.width`, `room.height` for dynamic positioning
- No dead space in the layout
- No overlapping rooms
- Digital clock replaces analog
- Simplified gym layout
- All agent positions updated to match new room layout