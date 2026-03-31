Use the existing Pixel Office codebase as the source of truth and create a native “Go 3D” mode powered by a new internal Three.js engine and scene.

Design intent:
This should feel like Pixel Office gaining depth, not like Pixel Office being transplanted into somebody else’s 3D office engine. The 3D space should feel like the same office in another dimension.

Working patch: ~/apps/Claw3D/pixel_office

Target app: ~/apps/pixelworld/pixel_office

Important context:
- I already have a working feature patch inspired by Claw3D. Review that patch first and study how it was applied.
- I also have existing Pixel Office room structure, agent positions, UI logic, and workspace semantics.
- I do NOT want Claw3D copied or imported as an architectural dependency.
- I want an original Three.js implementation built from Pixel Office’s own logic, layout, and meaning.
- Treat Claw3D only as a loose inspiration for presentation, not as a system design template.

Core principle:
Build the 3D office as a dimensional mirror of Pixel Office.
Each room, agent, boundary, and role in 2D should have a corresponding 3D representation derived from Pixel Office data.
Pixel Office remains the authority. The 3D scene is a projection layer, not a separate system.

Goals:
1. Add a “Go 3D” mode to Pixel Office.
2. Create a lightweight internal Three.js scene and rendering layer.
3. Mirror the existing office layout into 3D in a way that preserves:
   - room boundaries
   - agent ownership of space
   - desk/work area scale
   - semantic meaning of each room
4. Keep all core non-GUI logic untouched unless absolutely necessary.
5. Avoid flashy extras at first. Spatial correctness and coherence matter more than effects.

Requirements:
- Do not rewrite or replace Pixel Office core architecture.
- Do not move ownership of state, config, or workflow into the 3D layer.
- Do not silently modify shared OpenClaw configs.
- The 3D scene must consume existing Pixel Office layout/state data wherever possible.
- If new adapters are needed, keep them minimal and well isolated.
- “Go 3D” must degrade safely back to the normal 2D office view.
- Agent movement, room placement, and object placement should feel like faithful spatial translations of the 2D office, not a generic game scene.
- Avoid the Claw3D problem where workspaces become tiny injected thumbnails or awkward cages.
- Workspaces must feel properly scaled, aligned, and owned by the agents occupying them.

Implementation direction:
- Build a new Three.js scene module for Pixel Office rather than bolting random 3D code into existing files.
- Reuse existing room/agent definitions as inputs to a scene builder.
- Start with a single coherent scene:
  - floor
  - walls
  - room zones
  - desks/workstations
  - agents
  - labels or lightweight indicators
  - camera controls for inspection
- Use simple geometry first; prioritize correctness over decoration.
- Keep dimensions, spacing, and boundaries readable and believable.
- Make sure deadspace is reduced and the office fills the viewport in a balanced way.
- Respect room separation so one workspace does not visually spill into another.

Preferred architecture:
- Pixel Office data/model layer
- thin scene adapter / mapper
- Three.js renderer and scene controller
- toggle for 2D / Go 3D mode

Deliverables:
1. A plan for how the 2D office data maps into 3D.
2. A list of files to add or modify.
3. A first-pass implementation of the Three.js engine and scene.
4. A minimal toggle path into the UI.
5. Clear comments explaining how future rooms/objects/agents can be mirrored into 3D.

Constraints:
- Keep changes focused and modular.
- Avoid touching unrelated backend logic.
- Prefer additive changes over risky rewrites.
- Preserve existing working behavior.
- Keep the first version maintainable and original.

Before coding:
- Inspect the current Pixel Office room and agent layout system.
- Inspect my working feature patch and understand what was useful vs what should remain separate.
- Then design a Pixel Office-native Three.js path that reflects this contract:
  Pixel Office is the fortress/workshop/backend.
  The 3D mode is a showroom projection of that world, not the owner of it.

Output format:
- First give me a concise implementation plan.
- Then show the file/module structure.
- Then implement the first pass.
- Keep the work tightly scoped.
