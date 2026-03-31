Task: Refactor the Pixel Office layout into a structured grid-based system.

Context:
The current layout uses absolute pixel coordinates and has overlap, misalignment, and inconsistent scaling. We need to normalize it into a clean spatial system.

Instructions:

1. Convert the layout into a grid system:
- Define a consistent cell size (e.g., 160x160 or similar)
- Snap all rooms to this grid
- No overlapping coordinates allowed

2. Enforce layout hierarchy:
- Top row: leadership / thinking roles (Executive, Sherlock, Specialist)
- Middle row: interaction + shared spaces (Lobby, Reception, Open Office)
- Bottom row: support + infrastructure (Gym, Archive, Mission Control)

3. Normalize room sizes:
- Small rooms = 1 cell
- Medium rooms = 2 cells
- Large rooms (Open Office, Conference) = 3–4 cells
- Remove arbitrary pixel widths

4. Movement:
- Ensure walkable paths between all rooms
- No isolated or “floating” zones

5. Output:
- Updated ASCII blueprint (grid-based)
- Updated coordinate system (grid coords, not pixels)
- Clean mapping: zone → grid position → size

Constraints:
- No overlapping x/y ranges
- No arbitrary placement
- No decorative ASCII

Goal:
Turn the layout into a scalable system that can support agent movement, resizing, and future features.
