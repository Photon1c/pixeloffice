Task: Fix the Pixel Office layout engine so rooms, furniture, and agents respect room boundaries and the office uses the full canvas.

Current problems:
- Workspaces and furniture extend into neighboring rooms
- Agent areas are not clipped to their assigned room bounds
- Large dead space exists across the page
- The whole office is compressed into the upper-left corner instead of using the available viewport
- Some props visually spill across walls and zone boundaries

What to change:

1. Enforce hard room boundaries
- Every room must have a strict rectangular bounding box
- All room-owned props, desks, furniture, and decorations must render fully inside that room’s bounds
- No prop may overflow into another room
- No agent desk area may extend outside its assigned zone

2. Add clipping / containment rules
- Treat each room as a container
- Furniture placement must be constrained by inner padding inside the room
- Use safe margins so labels, props, and agents do not touch or cross walls
- If needed, scale furniture down to fit rather than letting it overflow

3. Expand layout to fill the canvas
- Recompute the office layout so it uses the available page width and height
- Center or distribute the office across the viewport instead of packing it into the upper-left corner
- Reduce dead space by scaling or redistributing rows/columns across the full canvas

4. Keep grid logic, but make it responsive
- Preserve the grid-based room system
- Recalculate cell size from the viewport dimensions
- Rooms should scale and reposition to fit the actual available screen space

5. Respect room ownership
- Named agent rooms must remain visually separate and contained
- Do not let Open Office, Archives, Data Nodes, or any other room bleed into adjacent spaces
- HermitClaw still owns Archives
- Hercule still owns War Room
- ZeroClaw still owns Sandbox
- Sherlobster still owns Strategy Suite
- LeslieClaw still owns Executive Suite

6. Add layout validation
Before finalizing the layout, validate:
- no overlapping room rectangles
- no prop outside parent room bounds
- no desk outside assigned room
- office footprint uses most of the available viewport
- no excessive empty area on right or bottom unless intentionally reserved

7. Output
Return:
- revised room bounds
- revised desk/agent positions
- brief explanation of how containment is enforced
- brief explanation of how the office now fills the viewport

Important:
This is not a style pass. This is a spatial containment and scaling fix.
Prioritize geometry, fit, clipping, and use of canvas over decoration.
