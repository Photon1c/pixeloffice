# Pixel Office - Refined Grid Layout

**Date:** 2026-03-22  
**Refinement:** Based on `next_update.md` improvements

---

## ASCII Blueprint (Refined Grid)

```
      Col0    Col1    Col2    Col3    Col4    Col5    Col6
Row0  EXEC    SHERLOCK ZEROCLAW CONF   KITCHEN
Row1  LOBBY   OPEN OFFICE       WAR RM  ARCHIVES
Row2  GYM     SHERLOBSTER MISSION DATA NODES
```

---

## Changes from Previous Layout

### 1. Reduced Open Office Dominance
- **Before:** 3x2 cells (480x240)
- **After:** 2x1 cells (320x120)
- **Reason:** Open Office no longer visually swallows the center

### 2. Improved Left-Side Balance
- **Before:** Lobby cramped at (0,1) with 1x1, awkwardly stacked
- **After:** Executive at (0,0), Lobby at (0,1), Gym at (0,2) - clean vertical stack
- **Reason:** Each space gets dedicated cell, feels intentional

### 3. Strengthened Agent Identity
- **Before:** "Specialist Suite" - generic name
- **After:** "ZeroClaw Sandbox" - dedicated testing zone
- **Reason:** Each named agent room reads as agent-owned

### 4. Fixed Strategic Adjacency
- **Sherlock** at (1,0) above **Sherlobster** at (1,2)
- **Hercule's War Room** at (3,1) near strategy zones
- **Reason:** Sherlock ↔ Sherlobster analysis loop, Sherlobster → Hercule decision flow

### 5. Clarified Unowned Rooms
- **Mission Control** at (2,2) - infrastructure monitoring
- **Data Nodes** at (3,2,2x1) - IronClaw's infrastructure zone
- **Reason:** Clear function and adjacency purpose

### 6. Rebalanced Top Row
- **Conference:** 2x1 → 1x1
- **Kitchen:** 2x1 → 1x1
- **Reason:** Agent spaces feel more important than shared amenities

---

## Room Grid Positions

| Room | Grid (col,row,w,h) | Pixels (x,y,w,h) | Agent |
|------|-------------------|------------------|-------|
| executive | (0,0,1,1) | (0,0,160,120) | LeslieClaw |
| sherlock | (1,0,1,1) | (160,0,160,120) | Sherlock |
| zeroClaw | (2,0,1,1) | (320,0,160,120) | ZeroClaw |
| conference | (3,0,1,1) | (480,0,160,120) | - |
| kitchen | (4,0,1,1) | (640,0,160,120) | - |
| lobby | (0,1,1,1) | (0,120,160,120) | FrontDesk |
| openOffice | (1,1,2,1) | (160,120,320,120) | OpenClaw |
| warRoom | (3,1,1,1) | (480,120,160,120) | Hercule |
| archives | (4,1,1,2) | (640,120,160,240) | HermitClaw |
| gym | (0,2,1,1) | (0,240,160,120) | - |
| sherlobster | (1,2,1,1) | (160,240,160,120) | Sherlobster |
| missionCtrl | (2,2,1,1) | (320,240,160,120) | - |
| dataNodes | (3,2,2,1) | (480,240,320,120) | IronClaw |

---

## Agent → Zone Mapping

| Agent | Room | Grid Position | Rationale |
|-------|------|---------------|-----------|
| LeslieClaw | executive | (0,0) | Leadership at top-left |
| Sherlock | sherlock | (1,0) | Near Sherlobster for analysis loop |
| ZeroClaw | zeroClaw | (2,0) | Sandbox testing zone |
| FrontDesk | lobby | (0,1) | Routing hub near entry |
| OpenClaw | openOffice | (1,1) | Shared workspace |
| Hercule | warRoom | (3,1) | Strategic decisions, near archives |
| HermitClaw | archives | (4,1) | Quiet edge domain |
| Sherlobster | sherlobster | (1,2) | Adjacent to Sherlock above |
| IronClaw | dataNodes | (3,2) | Infrastructure/data systems |

---

## Adjacency Improvements

| Agent Pair | Adjacency | Logic |
|------------|-----------|-------|
| Sherlock ↔ Sherlobster | Vertical (1,0) above (1,2) | Analysis ↔ Strategy loop |
| Sherlobster → Hercule | Diagonal via openOffice | Strategy → Decision flow |
| Hercule ↔ Archives | Horizontal | Investigation → Evidence |
| IronClaw ↔ MissionCtrl | Horizontal (3,2) next to (2,2) | Infrastructure monitoring |
| FrontDesk → Kitchen | Via lobby | Reception → Break area |

---

## Layout Flow

1. **Leadership Layer (Row 0):** Executive → Investigation → Testing continuum
2. **Operations Layer (Row 1):** Routing → Collaboration → Decisions → Records
3. **Infrastructure Layer (Row 2):** Wellness → Strategy → Monitoring → Data

---

## Zone Mood Configuration

| Zone | Mood | Intensity | Color |
|------|------|-----------|-------|
| executive | strategic | high | #d2b95a |
| sherlock_office | analytical | high | #4a5568 |
| zeroclaw_sandbox | experimental | high | #966ed2 |
| warRoom | intense | high | #be5050 |
| lobby | welcoming | medium | #b4a87c |
| openOffice | operational | medium | #605848 |
| archives | reflective | low | #7c6c56 |
| gym | relaxed | low | #64b46e |
| missionControl | intense | high | #be5050 |
| dataNodes | operational | medium | #4a6b8a |

---

## Files Updated

- `src/utils/layout.ts` - Grid positions, room definitions, zone config
- `src/utils/agentLogic.ts` - Agent initial positions
- `docs/active/refined_layout_2026-03-22.md` - This documentation