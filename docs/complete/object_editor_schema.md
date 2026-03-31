# Pixel Office Object Editor – Starter Schema

This document sketches a minimal data model for representing the Pixel Office layout and objects, so that a future object editor (e.g., driven by a Cursor/OpenCode agent) can manipulate room layouts via data instead of hard-coded coordinates.

The goal is **simplicity first**: one or two core files that describe rooms and objects, which the renderer and editor both read/write.

---

## 1. Core Concepts

- **Room** – a named area in the office (e.g., "LeslieClaw Office", "Sherlock Office", "Sherlobster Strategy Room", "Hercule War Room", "Open Office", "Lobby").
- **Object** – a visual entity placed inside a room (desks, chairs, plants, monitors, rugs, doors, etc.).

Later we can extend with layers, triggers, and interactions, but the MVP is just:

- `rooms[]`
- `objects[]`

---

## 2. Example Layout File (JSON)

A single JSON file could live at something like:

- `pixel_office/layout/office_layout.json`

### 2.1. Types (informal)

```ts
// Logical coordinate system: pixels or tile units, as long as it's consistent.
// Assumes (0,0) is top-left of the room.

type RoomId = string;
type ObjectId = string;

type Room = {
  id: RoomId;
  name: string;           // "Sherlock Office", "LeslieClaw Office", etc.
  kind: string;           // e.g. "executive", "strategy", "war_room", "archive", "open_office"
  width: number;          // in world units (px or tiles)
  height: number;         // in world units
  backgroundSprite?: string; // optional: sprite key for room background
  meta?: {
    ownerAgentId?: string;    // e.g. "sherlock", "leslieclaw", "sherlobster"
    notes?: string;           // freeform description
  };
};

type Object = {
  id: ObjectId;
  roomId: RoomId;         // which room this object belongs in
  type: string;           // e.g. "desk", "chair", "plant", "rug", "monitor", "door"
  spriteId: string;       // sprite key / atlas id
  x: number;              // position within room
  y: number;
  width?: number;         // optional explicit size (else take from sprite)
  height?: number;
  rotation?: number;      // degrees or radians
  zIndex?: number;        // draw order override
  label?: string;         // optional label (e.g. "Sherlock's Desk")
  props?: Record<string, unknown>; // extensible per-type properties
};

export type OfficeLayout = {
  rooms: Room[];
  objects: Object[];
};
```

### 2.2. Minimal Example JSON

```json
{
  "rooms": [
    {
      "id": "leslie_office",
      "name": "LeslieClaw – Executive Office",
      "kind": "executive",
      "width": 320,
      "height": 180,
      "backgroundSprite": "bg_leslie_office",
      "meta": {
        "ownerAgentId": "leslieclaw",
        "notes": "Bright, grounded office with guitar and bookshelf."
      }
    },
    {
      "id": "sherlock_office",
      "name": "Sherlock – Systems Detective Office",
      "kind": "executive",
      "width": 320,
      "height": 180,
      "backgroundSprite": "bg_sherlock_office",
      "meta": {
        "ownerAgentId": "sherlock",
        "notes": "Navy accent wall, diagrams, fountain pen." 
      }
    },
    {
      "id": "sherlobster_strategy",
      "name": "Sherlobster – Executive Strategy Room",
      "kind": "strategy",
      "width": 280,
      "height": 160,
      "backgroundSprite": "bg_sherlobster_strategy",
      "meta": {
        "ownerAgentId": "sherlobster",
        "notes": "Council/decision room with round table." 
      }
    },
    {
      "id": "hercule_war_room",
      "name": "Hercule – Investigation War Room",
      "kind": "war_room",
      "width": 280,
      "height": 160,
      "backgroundSprite": "bg_hercule_war_room",
      "meta": {
        "ownerAgentId": "hercule_prawnro",
        "notes": "Case room with pinboards and timelines." 
      }
    }
  ],
  "objects": [
    {
      "id": "obj_leslie_desk",
      "roomId": "leslie_office",
      "type": "desk",
      "spriteId": "desk_large",
      "x": 120,
      "y": 100,
      "label": "Leslie's Desk"
    },
    {
      "id": "obj_leslie_guitar",
      "roomId": "leslie_office",
      "type": "guitar_stand",
      "spriteId": "guitar_stand",
      "x": 240,
      "y": 110
    },
    {
      "id": "obj_sherlock_desk",
      "roomId": "sherlock_office",
      "type": "desk",
      "spriteId": "desk_dark",
      "x": 130,
      "y": 100,
      "label": "Sherlock's Desk"
    },
    {
      "id": "obj_sherlobster_table",
      "roomId": "sherlobster_strategy",
      "type": "table_round",
      "spriteId": "table_round_large",
      "x": 140,
      "y": 90
    },
    {
      "id": "obj_hercule_board",
      "roomId": "hercule_war_room",
      "type": "pinboard",
      "spriteId": "pinboard_large",
      "x": 40,
      "y": 20
    }
  ]
}
```

---

## 3. How a Future Object Editor Would Use This

A future Pixel Office object editor (GUI) can:

1. **Load** `OfficeLayout` from `office_layout.json`.
2. Render rooms and their objects according to `x`, `y`, `spriteId`, etc.
3. Allow the user to:
   - Select a room.
   - Drag objects around (updating `x`/`y`).
   - Add/remove objects.
   - Edit properties (e.g. `type`, `spriteId`, `label`).
4. **Save** back to the same JSON.

Cursor/OpenCode would mostly work on:
- Maintaining this schema,
- Implementing the editor UI,
- Wiring the renderer to consume `OfficeLayout` instead of hard-coded coordinates.

This keeps layout changes data-driven and makes future remodeling cheap in tokens and time.