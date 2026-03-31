Task: Normalize spatial composition and object scaling across all rooms in Pixel Office. This is a refinement pass on top of the current aligned layout.

Do NOT modify core logic. GUI only.

Current state:
- Grid layout is now correct
- Rooms are aligned and consistent
- However, internal composition is inconsistent:
  - Objects float without grounding
  - Scale differs wildly between rooms
  - Some rooms use inset scenes, others full-room layouts
  - Agents feel like overlays instead of occupants

Goal:
Make every room follow the SAME spatial language so the office feels like one coherent world.

---

### 1. Introduce a "Room Interior System"

Each room must follow this structure:

[Top padding]
[Back wall / background layer]
[Main object layer (desk / terminal / equipment)]
[Agent layer (aligned to objects)]
[Floor strip or anchor line]
[Bottom padding]

Rules:
- Objects must sit on a visible or implied "floor line"
- Agents must align with that same floor
- No floating elements unless explicitly intentional

---

### 2. Standardize Scale Ratios

Define consistent proportions across ALL rooms:

- Main object (desk/terminal/etc): ~30–50% of room width
- Agent height: ~60–80% of desk height
- Padding: consistent margin on all sides

Do NOT allow:
- Tiny inset workspaces inside large rooms
- Oversized empty rooms with tiny objects

If a room is large → scale objects up, not down.

---

### 3. Remove "Inset Thumbnail" Effect

Replace this pattern:
[ big room ]
    [ tiny workspace box ]

With:
[ room itself IS the workspace ]

Only use inset panels if they are visually framed and intentional (e.g., screens, dashboards).

---

### 4. Depth Consistency

Pick ONE style and apply everywhere:

Option A (recommended for now):
→ Flat side-view pixel rooms with implied depth

Rules:
- Back wall color layer
- Slightly darker floor strip
- Objects sit at boundary between them

Avoid mixing:
- perspective desks
- flat UI panels
- floating props

---

### 5. Anchor Everything

Every object must answer:
"What is this sitting on?"

- Desk → floor
- Terminal → desk
- Mic → desk
- Agent → floor aligned to desk

No mid-air placement.

---

### 6. Reduce Negative Space Imbalance

- Large rooms should not feel empty
- Small rooms should not feel cramped

Fix by:
- scaling objects proportionally
- not adding clutter

---

### 7. Keep It Minimal

Do NOT:
- add more props
- add decorations just to fill space

Fix structure first.

---

### Deliverables

1. Brief diagnosis of current inconsistencies (based on screenshot)
2. Introduce a shared layout rule set (constants or config)
3. Apply to 2–3 rooms first (Executive Office, Open Office, Data Nodes)
4. Then propagate to all rooms
5. Small changelog of what was normalized

---

### Success Criteria

- All rooms feel like the same physical world
- Agents feel placed, not pasted
- No more tiny “caged” workspaces
- Objects feel grounded and proportional
- Visual clarity improves WITHOUT adding detail
