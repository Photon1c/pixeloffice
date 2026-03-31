Task: Refactor the Pixel Office layout into a clean, grid-based system while preserving agent-specific zones.

Context:
The current layout uses inconsistent pixel coordinates, has overlaps, and lacks structural hierarchy. We need to normalize it into a scalable system WITHOUT losing agent identities or their dedicated spaces.

--------------------------------------------------
1. GRID SYSTEM
--------------------------------------------------
- Convert layout into a consistent grid (e.g., fixed cell size)
- Snap all zones to grid positions
- No overlapping coordinates allowed
- Replace pixel-based positioning with grid coordinates

--------------------------------------------------
2. LAYOUT HIERARCHY
--------------------------------------------------
Organize the office into logical layers:

Top Row (Leadership / Thinking Layer):
- LeslieClaw (Executive)
- Sherlock (Investigation)
- Specialist

Middle Row (Interaction / Operations):
- Lobby / Reception (OpenClaw routing zone)
- Open Office (shared workspace)
- Conference Rooms

Bottom Row (Support / Infrastructure):
- War Room (Hercule)
- Strategy Suite (Sherlobster)
- Infrastructure (IronClaw)
- Sandbox / Testing (ZeroClaw)
- Archives (HermitClaw)

--------------------------------------------------
3. AGENT → ZONE MAPPING (DO NOT BREAK)
--------------------------------------------------
Each agent must retain a dedicated space:

- LeslieClaw → Executive Office
- OpenClaw → Lobby / Reception (routing hub)
- Sherlock → Investigation Office
- Sherlobster → Strategy Suite
- Hercule → War Room
- IronClaw → Infrastructure Zone
- ZeroClaw → Sandbox / Testing Zone
- HermitClaw → Archives

Rules:
- Do NOT duplicate agent rooms
- Do NOT merge agent zones into generic areas
- Open Office is shared, not owned

--------------------------------------------------
4. SPATIAL LOGIC
--------------------------------------------------
- Sherlock near Sherlobster (analysis ↔ strategy loop)
- Sherlobster near Hercule (strategy → decision)
- HermitClaw (Archives) placed in a quiet, low-traffic edge
- OpenClaw near entry (Lobby/Reception)
- IronClaw + ZeroClaw near infrastructure layer
- No isolated or unreachable zones

--------------------------------------------------
5. ROOM SIZING
--------------------------------------------------
Normalize sizes:
- Small rooms: 1 grid cell
- Medium: 2 cells
- Large (Open Office, Conference): 3–4 cells

Remove arbitrary pixel dimensions

--------------------------------------------------
6. MOVEMENT
--------------------------------------------------
- Ensure walkable paths between all zones
- No “floating” rooms
- Layout must support agent movement and interaction

--------------------------------------------------
7. OUTPUT FORMAT
--------------------------------------------------
Return:

1. ASCII blueprint (grid-based, aligned)
2. Grid coordinate map (zone → position → size)
3. Agent → Zone mapping table
4. Adjacency list (which zones connect)
5. Short explanation of layout flow

--------------------------------------------------
CONSTRAINTS
--------------------------------------------------
- No decorative ASCII art
- No emojis
- No overlapping zones
- Preserve agent identities

Goal:
Transform the office into a structured, scalable system that supports agent behavior, movement, and future features.
