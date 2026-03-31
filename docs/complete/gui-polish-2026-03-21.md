Task: Apply a light GUI polish pass to the Pixel Office app, focused only on visual/layout improvements. Do NOT modify core non-GUI logic, agent behavior, backend flows, task routing, data models, event systems, or anything outside presentation/layout/styling/rendering of the office view.

Context:
The current office is visually interesting, but the room/workspace composition has drifted into awkward proportions. Individual agent workspaces look like tiny injected thumbnails pasted into larger rooms. The result is:
- room boundaries and interior contents feel misaligned
- agent workspaces are out of scale with the room they are placed in
- some agents appear visually trapped in tiny “cages”
- injected mini-scenes break the illusion of a coherent office floorplan
- spacing, padding, and framing are inconsistent across rooms

Goal:
Keep the same overall Pixel Office concept, room types, and retro/pixel-office identity, but improve visual coherence with a restrained polish pass. This should feel like a cleanup and alignment pass, not a redesign.

Hard constraints:
1. GUI-only changes.
2. No touching core non-GUI code.
3. No new product features.
4. No major architectural rewrites unless absolutely required for GUI isolation.
5. Preserve the current office map structure and existing room purposes.
6. Keep the current pixel-art/retro-office feel.
7. Avoid over-detailing. Prefer cleaner composition over more objects.
8. If needed, create small GUI-only helper modules/components, but keep changes minimal and well-contained.

Priority problems to solve:
1. Scale mismatch
   - Agent workspaces should no longer look like tiny thumbnails embedded inside oversized rooms.
   - Rebalance proportions so desks/work areas feel native to each room.

2. Boundary cleanup
   - Room edges, internal framing, and workspace boxes need consistent margins/padding.
   - Agents should not appear pressed against borders or boxed into tiny cells.

3. Layout alignment
   - Align room contents more consistently within each room.
   - Reduce the feeling that assets were dropped in arbitrarily.
   - Normalize anchor points, spacing, and composition across rooms.

4. Visual hierarchy
   - Rooms should read clearly at a glance.
   - Important contents should be legible without requiring extra detail.
   - Reduce clutter where detail is harming readability.

5. Cohesion
   - Each room should feel like part of one office, not separate art experiments stitched together.
   - Keep variety, but unify framing language, spacing, and scale.

Suggested approach:
- Audit the office rendering/layout layer only.
- Identify where room interior canvases, workspace cards, sprites, desks, or embedded sub-scenes are being scaled or positioned inconsistently.
- Standardize a simple layout system for room interiors:
  - consistent inner padding
  - consistent usable content area
  - consistent sprite-to-room proportions
  - consistent desk/workstation footprint relative to room size
- Replace “mini thumbnail workspace pasted into room” composition with “workspace fills the room naturally.”
- Prefer fewer, larger, better-placed visual elements over extra decoration.
- Adjust room internals so agents appear to inhabit the room, not sit inside a tiny inset panel unless that inset is deliberately designed and visually justified.
- Keep polish subtle: cleaner borders, spacing, scale, alignment, and framing.

What not to do:
- Do not rewrite simulation logic.
- Do not change agent state logic.
- Do not add gameplay systems.
- Do not introduce flashy animation for its own sake.
- Do not replace the whole art direction.
- Do not add lots of new decorative assets just to make it “busier.”
- Do not make the office glossy or non-pixel.
- Do not turn this into a full redesign.

Desired output:
1. A brief diagnosis of what specifically is causing the “tiny workspace injected into room” look.
2. A small, targeted implementation plan.
3. GUI-only code changes.
4. A short changelog describing exactly what visual/layout rules were normalized.
5. Before finishing, sanity-check that:
   - rooms feel better scaled
   - agents are not visually boxed into tiny cages
   - workspaces feel native to rooms
   - the office remains recognizably Pixel Office

Success criteria:
- The office looks cleaner, more intentional, and more spatially coherent.
- Rooms feel proportionate.
- Agent work areas feel properly integrated into each room.
- The result is visibly better, but still unmistakably the same app.

Use the attached screenshot as the visual reference for the current problems. Base the polish pass on what is actually visible there.
