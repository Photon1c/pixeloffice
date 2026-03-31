OPENCODE: Pixel Office Phase A – Visual & Animation Polish
Repo: ~/apps/pixelworld/pixel_office
Context: CoolerSession + SCRUM are fully integrated and tested. This phase is visual polish only: animations and environment props. Do not modify the conversation engine or APIs.
o
0. Ground Rules
Keep all existing behavior intact:
Cooler sessions and SCRUM sessions must still work exactly as before (same routes, same logs).
Limit changes to:
Rendering / layout (drawOffice, drawAgent, zone renderers).
Simple animation timing / movement logic (where agents walk/sit).
New static assets / props.
No changes to:
server/conversation/*
server/services/coolerTalkService.ts
SCRUM logic or session formats.
Use the existing docs for reference (do not invent new flows):

docs/FINAL_SUMMARY.md
docs/IMPLEMENTATION_SUMMARY.md
docs/COOLERSESSION_INTEGRATION_SUMMARY.md
docs/COOLERSESSION_EXEC_SUMMARY.md
1. Animation & Choreography Polish
Goal: Make cooler and SCRUM sessions feel more like scenes without touching the engine.

1.1 Cooler Talk (Kitchen)
When a cooler session runs (kitchen):

Entry:

Agents should visibly walk from their desks into the kitchen zone (if they aren’t already there).
Add a brief timing delay so they don’t “teleport.”
During conversation:

Agents in the kitchen should idle near:
Coffee machine.
Fridge.
Counter/standing area.
Slight idle bobbing or subtle animation is enough.
Exit:

After cooler talk ends, agents walk back to their home zones/desks.
Use the existing zone helpers (layout.ts, agentLogic.ts) to determine:

Where “kitchen” is.
Where each agent’s home position is.
1.2 SCRUM (Conference Room / Mission Control)
For SCRUM sessions:

Room choice:

Use the Conference Room as the default SCRUM room.
Optionally, allow a future parameter for Mission Control, but keep it simple for now.
Entry:

Relevant agents (clerk, specialist, executive, archivist) walk into the Conference Room.
Have them pick fixed “chair” positions around the table.
Seating:

Represent seated state simply:
Different sprite offset.
Lower vertical position.
Slight posture change if that’s already supported.
Exit:

After SCRUM completes, agents return to their desks.
Keep the animation logic straightforward and deterministic (no random jitter that would complicate tests).

2. Environment Props / Office Objects
Goal: Make each zone visually distinct and more “lived in” by adding static objects. Keep everything consistent with the remodel plan.

Touch mainly:

src/utils/drawOffice.ts
src/utils/layout.ts
Any existing “drawX” helpers (e.g. drawLobby, drawArchives, etc.)
2.1 Kitchen & Cooler
Add:

Coffee machine:
Simple rectangle + spout + indicator light on a counter.
Coffee mugs:
A few small mug shapes on/near the counter.
Stocked fridge:
Fridge rectangle with a “handle”; light shading or color to distinguish.
Optionally a couple of drawn “shelves” inside if open, but closed is fine.
Snack shelf / cabinet:
Small shelving unit with a few colored blocks for snacks or cups.
Place props within the existing Kitchen bounds; don’t change the room layout, just decorate it.

2.2 Conference Room
Add:

Table center objects:
Notepads or laptops (simple rectangles).
A central “agenda” pad.
Wall accents:
A whiteboard:
Rectangle with a few colored strokes.
Or a large screen (if not already present).
These should help visually differentiate SCRUM scenes from cooler talk.

2.3 Archives & Records
Add:

Bookshelves:
One or two tall shelves along the walls.
Multiple horizontal lines with small colored rectangles for books.
Stacked boxes:
A couple of small box shapes to suggest storage / long-term records.
2.4 Open Office
Add subtle productivity props:

Extra monitors or paper stacks on desks.
Small plant or two (simple green blobs in pots).
Nothing too busy; we want a hint of life, not clutter.
2.5 Gym & Wellness
If the remodel already includes a Gym:

Weights:
Dumbbells or barbell shapes.
Mat:
A colored rectangle on the floor.
Optional: small shelf for towels/water.
2.6 Mission Control
Enhance the existing Mission Control visuals:

More screens with tiny fake graphs/lines.
A few extra indicator lights in different colors (green/yellow/red), consistent with existing style.
3. Zone Indicators & Labels (Small Tweaks)
The current implementation already has:

Zone labels.
BUSY/QUIET indicators.
Glowing/pulsing effects.
Polish:

Ensure zone labels and indicators don’t overlap new props.
Slight spacing/padding adjustments if needed so:
Labels remain readable.
Props don’t visually collide with text.
No behavioral changes; just minor layout tuning.

4. Constraints & Verification
After changes:

Build & TypeScript:

npm run build must pass.
No new TS errors.
Behavioral invariants:

Cooler Talk:
Still triggers correctly.
Still logs sessions the same way.
SCRUM:
Still produces the same markdown and JSON under data/scrum_logs/.
No changes to:
/api/rooms/:location/cooler/run-turn
/api/rooms/:location/cooler/export
SCRUM routes or payloads.
Visual sanity passes (manual):

Start the app, trigger:
A cooler session in the kitchen.
A SCRUM session in the Conference Room.
Confirm:
Agents visibly move into the right room.
Props appear in the right zones.
Agents return to desks after sessions end.
