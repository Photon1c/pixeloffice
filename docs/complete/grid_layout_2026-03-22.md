# Pixel Office Grid Layout

**Date:** 2026-03-22  
**Project:** Pixel Office GUI

---

## Grid System

- **Canvas:** 1120x720 (7 cols x 6 rows)
- **Cell size:** 160x120 pixels
- **Status bar:** 80px

---

## ASCII Blueprint (Grid-Based)

```
      Col0    Col1    Col2    Col3    Col4    Col5    Col6
Row0  EXEC    SHERLOCKSPECIAL  CONF RM         KITCHEN
Row1  LOBBY   OPEN OFFICE      WAR RM  ARCHIVES
Row2  
Row3  GYM     SHERLOBSTER MISSION DATA NODES
Row4  
Row5  
```

---

## Zone → Grid Position → Size

| Zone | Grid (col,row,w,h) | Pixels (x,y,w,h) | Agent |
|------|-------------------|------------------|-------|
| executive | (0,0,1,1) | (0,0,160,120) | LeslieClaw |
| sherlock | (1,0,1,1) | (160,0,160,120) | Sherlock |
| specialist | (2,0,1,1) | (320,0,160,120) | ZeroClaw |
| conference | (3,0,2,1) | (480,0,320,120) | - |
| kitchen | (5,0,2,1) | (800,0,320,120) | - |
| lobby | (0,1,1,1) | (0,120,160,120) | FrontDesk |
| openOffice | (1,1,3,2) | (160,120,480,240) | OpenClaw, IronClaw |
| warRoom | (4,1,1,1) | (640,120,160,120) | Hercule |
| archives | (5,1,1,2) | (800,120,160,240) | HermitClaw |
| gym | (0,3,1,1) | (0,360,160,120) | - |
| sherlobster | (1,3,1,1) | (160,360,160,120) | Sherlobster |
| missionCtrl | (2,3,1,1) | (320,360,160,120) | - |
| dataNodes | (3,3,4,2) | (480,360,640,240) | Infrastructure |

---

## Grid Coordinate Map

```
TOP ROW (Leadership / Thinking):
  [Exec(0,0)] [Sherlock(1,0)] [Specialist(2,0)] [    Conference(3,0,2)    ] [      Kitchen(5,0,2)      ]

MIDDLE ROW (Interaction / Operations):
  [Lobby(0,1)] [      Open Office(1,1,3x2)      ] [WarRoom(4,1)] [Archives(5,1,1x2)]

BOTTOM ROW (Support / Infrastructure):
  [Gym(0,3)] [Sherlobster(1,3)] [MissionCtrl(2,3)] [         Data Nodes(3,3,4x2)          ]
```

---

## Agent → Zone Mapping

| Agent | Zone | Grid Position |
|-------|------|---------------|
| LeslieClaw | executive | (0,0) |
| Sherlock | sherlock | (1,0) |
| ZeroClaw | specialist | (2,0) |
| FrontDesk | lobby | (0,1) |
| OpenClaw | openOffice | (1,1) |
| IronClaw | openOffice/dataNodes | (3,1) |
| Hercule | warRoom | (4,1) |
| HermitClaw | archives | (5,1) |
| Sherlobster | sherlobster | (1,3) |
| - | missionControl | (2,3) |
| - | dataNodes | (3,3) |
| - | gym | (0,3) |

---

## Adjacency List

| Zone | Adjacent Zones |
|------|----------------|
| executive | sherlock, lobby |
| sherlock | executive, specialist |
| specialist | sherlock, conference |
| conference | specialist, kitchen, warRoom |
| kitchen | conference |
| lobby | executive, openOffice, gym |
| openOffice | lobby, warRoom, archives, sherlobster |
| warRoom | conference, openOffice, archives, missionCtrl |
| archives | openOffice, warRoom, dataNodes |
| gym | lobby, sherlobster |
| sherlobster | gym, openOffice, dataNodes |
| missionCtrl | warRoom, dataNodes |
| dataNodes | archives, sherlobster, missionCtrl |

---

## Layout Flow

1. **Leadership Layer (Row 0)**: Executive → Investigation → Specialist continuum for thinking work
2. **Operations Layer (Row 1)**: Central hub with Lobby routing, Open Office collaboration, War Room decisions
3. **Infrastructure Layer (Row 3)**: Support zones - Gym wellness, Strategy planning, Mission monitoring, Data processing

---

## Grid Helper Functions

```typescript
gridToPixel(col, row)  // Convert grid coords to pixels
pixelToGrid(x, y)      // Convert pixels to grid coords
gridToRect(gridPos)    // Convert grid position to rectangle
```

---

## Implementation Notes

- All rooms now use grid coordinates
- No arbitrary pixel placement
- No overlapping zones
- Agent positions must be updated in agentLogic.ts to match new grid positions
- Canvas reduced from 1200x800 to 1120x720 to fit 7x6 grid exactly