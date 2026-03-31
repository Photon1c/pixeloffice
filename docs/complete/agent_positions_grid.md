# Agent Positions - Grid Layout

**Date:** 2026-03-22  
**Grid System:** 7 cols × 6 rows, 160×120 cell size

---

## Agent → Zone Mapping

| Agent | Role | Room | Grid Position | Pixel Position | deskIndex |
|-------|------|------|----------------|----------------|-----------|
| LeslieClaw | executive | Executive | (0,0) | 80, 60 | 4 |
| Sherlock | specialist | Sherlock | (1,0) | 240, 60 | 5 |
| ZeroClaw | specialist | Specialist | (2,0) | 400, 60 | 6 |
| FrontDesk | receptionist | Lobby | (0,1) | 80, 150 | 0 |
| OpenClaw | clerk | OpenOffice | (1,1) | 200, 150 | 1 |
| HermitClaw | archivist | Archives | (5,1) | 860, 150 | 3 |
| Hercule Prawnro | specialist | WarRoom | (4,1) | 700, 150 | 8 |
| Sherlobster | specialist | Sherlobster | (1,3) | 200, 390 | 7 |
| IronClaw | custodian | DataNodes | (3,3) | 540, 390 | 2 |

---

## Constraints

- Each agent has a unique desk position
- No overlapping workspaces
- Agent positions aligned to grid cell boundaries

---

## CUBICLE_POSITIONS Index Reference

```typescript
export const CUBICLE_POSITIONS = [
  { x: 30, y: 150 },   // 0: Lobby - frontdesk (col0,row1)
  { x: 200, y: 150 },  // 1: OpenOffice (col1,row1) - openclaw
  { x: 540, y: 390 },  // 2: DataNodes (col3,row3) - ironclaw
  { x: 860, y: 150 },  // 3: Archives (col5,row1) - hermitclaw
  { x: 30, y: 30 },    // 4: Executive (col0,row0) - leslieclaw
  { x: 210, y: 30 },   // 5: Sherlock (col1,row0) - sherlock
  { x: 370, y: 30 },   // 6: Specialist (col2,row0) - zeroclaw
  { x: 200, y: 390 },  // 7: Sherlobster (col1,row3) - sherlobster
  { x: 700, y: 150 },  // 8: WarRoom (col4,row1) - hercule
];
```

---

## Room Grid Positions

| Room | Grid (col, row, w, h) | Pixels (x, y, w, h) |
|------|----------------------|-------------------|
| executive | (0,0,1,1) | (0,0,160,120) |
| sherlock | (1,0,1,1) | (160,0,160,120) |
| specialist | (2,0,1,1) | (320,0,160,120) |
| conference | (3,0,2,1) | (480,0,320,120) |
| kitchen | (5,0,2,1) | (800,0,320,120) |
| lobby | (0,1,1,1) | (0,120,160,120) |
| openOffice | (1,1,3,2) | (160,120,480,240) |
| warRoom | (4,1,1,1) | (640,120,160,120) |
| archives | (5,1,1,2) | (800,120,160,240) |
| gym | (0,3,1,1) | (0,360,160,120) |
| sherlobster | (1,3,1,1) | (160,360,160,120) |
| missionCtrl | (2,3,1,1) | (320,360,160,120) |
| dataNodes | (3,3,4,2) | (480,360,640,240) |