# Pixel Office – ONECODE Implementation Handoff

This document is the engineering blueprint for implementing the **Pixel Office** visualization in code. ONECODE should use this as the primary spec when generating React/JS + Canvas code.

## High-Level Goal

Create a **2D pixel art office** for AI agents, rendered with **HTML5 Canvas** (inside a React component or plain JS entrypoint). It should feel like a **retro office-sim RPG**, where AI agents walk around, sit at their desks, and their status is driven by an `/api/employee-status` endpoint.

Constraints:
- Single canvas ~**1100×720** pixels.
- **Dark theme**, retro vibe.
- **All art via Canvas APIs** (`fillRect`, simple paths) – **no external image assets**.
- Font: **JetBrains Mono** (for labels and UI text, if available on system / via CSS).
- Implementation should be clean, modular, and easy to extend.

Implementation target: assume a modern React setup (e.g. React 18, Vite/Next) but avoid framework-specific APIs where possible. A single `<PixelOffice />` component that owns the canvas is ideal.

---

## Layout & World Design

Canvas: `width ≈ 1100`, `height ≈ 720`.

### 1. Floor & Grid

- **Background**: dark navy base color.
- **Checkered floor**:
  - Tile size: 16×16 or 20×20 pixels (ONECODE can pick, but be consistent).
  - Alternate tiles with two close navy colors for a subtle retro grid.
  - Draw this once into an offscreen canvas or cached pattern for performance, then `fillRect` with pattern each frame.

### 2. Office Regions

From top to bottom, left to right:

1. **Top row (three rooms spanning the width)**
   - Each room roughly one-third of the width.
   - Thin walls between them using a lighter border color.

   a. **Conference Room** (left third)
   - Round (or octagonal) table in center.
   - 4–6 chairs around the table (simple rectangles with a contrasting color).
   - Optionally a small whiteboard on the wall.

   b. **Boss Office** (middle third)
   - Large executive desk at bottom center of this room.
   - Couch along one wall.
   - Bookshelf against the back wall (stacked rectangles for books).

   c. **Kitchen** (right third)
   - White cabinets along back wall.
   - Fridge (tall rectangle with handle).
   - Coffee machine on the counter (small rectangle with a darker top and a spout).

2. **Middle area – cubicle rows**

   - Two rows (upper row, lower row) of **4 cubicles each** → 4×2 grid.
   - Cubicles separated by corridors vertically and horizontally.

   Each **cubicle**:
   - Desk rectangle.
   - Blue-screen monitor (blue rectangle with small darker border).
   - Name plate area (small rectangle with later text drawn over it).
   - Status dot near the name plate: green = working, red = idle.
   - **Unique desk item** per agent (see Agent roles below): small colored icon shape placed on desk.

3. **Right-side Lounge**

   Occupies a right-hand column area extending roughly from top of cubicles to near the bottom:
   - Couch (large rectangle + armrests).
   - Coffee table (low rectangle).
   - Water cooler (tall rectangle with blue tank segment).
   - Bean bags (rounded/irregular blobs using rectangles + small offsets or simple paths).
   - Ping pong table (green rectangle with white center line and small paddles drawn as circles/rectangles).
   - Whiteboard (light rectangle with thin border on wall).

4. **Plants / Trees**

   - Sprinkle small plants in corners and next to walls.
   - Simple design: brown trunk (rectangle) + green foliage (cluster of rectangles or a circle-like blob via multiple rectangles).

### 3. Bottom Status Bar

- At the bottom of the canvas, reserve ~80px height for a **status bar**.
- Darker background strip spanning width.
- For each agent:
  - Draw a badge: small rounded-rectangle or rectangle area.
  - Show a **color dot** (matching the agent’s shirt color) + **agent name** text + `Working` / `Idle` label.

---

## Agents & Animation

### 1. Agent Representation

Define a TypeScript/JS interface:

```ts
type AgentStatus = "working" | "idle";

interface Agent {
  id: string;          // e.g. "sherlock", "sherlobster", "hercule-prawnro"
  name: string;        // display name
  color: string;       // shirt or main accent color
  role: string;        // e.g. "researcher", "developer" etc. (for desk item)
  status: AgentStatus; // from API
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: "left" | "right";  // for sprite mirroring
  frame: 0 | 1;             // for 2-frame walking animation
  mode: "walking" | "sitting" | "idle-wander";
}
```

### 2. Visual Style (Character Sprite)

- Character size in world: base rect ~10×20, scaled visually so it feels ~20×40 (ONECODE can handle scaling by drawing larger rects or using a logical grid).
- Components:
  - Legs: two rectangles.
  - Torso: larger rectangle (filled with agent.color).
  - Arms: side rectangles.
  - Head: square/rect in skin-tone.
  - Hair: darker rectangle on top of head.

#### 2-Frame Walking

- Frame 0: left leg forward, right leg back; arms opposite.
- Frame 1: swap leg positions.
- One simple implementation: offset rectangles for legs and arms differently on each frame.

#### Sitting / Typing Animation

- Position character at the desk, facing the monitor.
- Legs mostly hidden behind desk.
- Arms forward (rectangles over the desk), optionally bobbing slightly up/down every few frames.

### 3. Movement Logic

- Use a **simple steering approach**:
  - At any given time, each agent has a `(targetX, targetY)`.
  - Each frame, move `x`/`y` toward target by a small speed (e.g. 1–2 pixels/frame).
  - Update `dir` based on horizontal delta.
  - Switch `frame` every N ms while moving (for walk cycle).

- **When status = "working"**:
  - `targetX,targetY` = coordinates of their assigned cubicle’s chair.
  - Once within a small radius (e.g. 4px), switch `mode` to `"sitting"`.

- **When status = "idle"**:
  - `mode` = `"idle-wander"`.
  - Choose random waypoints around the office regions:
    - Kitchen corners, lounge area, corridor nodes.
  - When an agent reaches a waypoint, pick a new one after a short idle delay.

### 4. Desk Assignments & Unique Items

Predefine a mapping from agent → cubicle position + desk item icon.

- Example agents (you can adjust IDs/names as needed):
  - `sherlock` – role: researcher – desk item: **globe**.
  - `sherlobster` – role: scout/creative – desk item: **fire** or palette.
  - `hercule-prawnro` – role: investigator/QA – desk item: **shield**.
  - Additional roles: writer (books), developer (coffee), designer (palette), camera/video (camera), motion (waveform).

Each desk item is a tiny icon built from rectangles:
- Globe: small circle-like shape (several rectangles) with a base.
- Books: stacked thin rectangles.
- Coffee: small mug rectangle + handle.
- Palette: rounded blob with colored dots.
- Camera: rectangle with a smaller lighter rectangle and a lens dot.
- Waveform: zigzag line made from small rectangles.
- Shield: vertical rounded rectangle with a center stripe.
- Fire: layered orange/red/yellow triangles/rectangles.

---

## Status API & Data Flow

### 1. API Contract

`GET /api/employee-status` (poll every **5 seconds**).

Expected JSON shape (ONECODE can assume this and we can match the backend later):

```json
{
  "employees": [
    { "id": "sherlock", "status": "working" },
    { "id": "sherlobster", "status": "idle" },
    { "id": "hercule-prawnro", "status": "working" }
  ]
}
```

- `id` must match the `Agent.id` values.
- `status` ∈ {"working", "idle"}.

### 2. Polling Mechanism

- In React, use `useEffect` with `setInterval` (and cleanup) OR `requestAnimationFrame`-driven timer:
  - Every 5000 ms (5s), fetch the endpoint.
  - On success, update agent statuses in local state.
  - On failure, keep previous state and optionally show a tiny indicator on the bottom bar.

- Status updates should drive behavior transitions:
  - `working` → set target to desk chair if not already there.
  - `idle` → if currently sitting, stand up and pick idle-wander waypoint.

---

## Rendering Architecture

ONECODE should structure the code something like this (pseudo-React):

```tsx
function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // 1) Update agent positions & animation frames based on delta
      // 2) Clear canvas
      // 3) Draw floor & rooms
      // 4) Draw cubicles & desks
      // 5) Draw agents
      // 6) Draw bottom status bar

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [agents]);

  useEffect(() => {
    // Poll /api/employee-status every 5s
  }, []);

  return <canvas ref={canvasRef} width={1100} height={720} />;
}
```

The actual render logic should be split into helper functions in a separate module, for clarity:

- `drawFloor(ctx)`
- `drawRooms(ctx)`
- `drawCubicles(ctx, agents)`
- `drawAgents(ctx, agents)`
- `drawStatusBar(ctx, agents)`

---

## Styling & Colors (Guidance)

ONECODE can choose final hex values, but aim for:
- **Floor**: deep navy (#050814, #0a1023 alternating tiles).
- **Walls**: slightly lighter blue-gray (#1b2333).
- **Desks**: muted browns or grays.
- **Monitors**: bright blue screens (#2f7fff) with darker border.
- **Status dots**: green (#3bd16f) for working, red (#ff4b4b) for idle.
- **Bottom bar**: very dark gray (#050509) with subtle border at top.

Agent shirt colors should be distinct and readable on a dark floor (e.g. teal, orange, purple, bright blue, magenta, etc.).

---

## Non-Goals / Simplifications for v1

- No need for pathfinding beyond straight-line movement to targets.
- No collision detection between agents – they can walk through each other.
- No zooming or panning – fixed camera on full office.
- No sound.

These can be added later if desired, but v1 should prioritize:
- Stable layout.
- Clear visual distinction between regions.
- Smooth-enough animation loop.
- Correct behavior for `working` vs `idle`.

---

## Acceptance Criteria

ONECODE implementation is considered successful when:

1. A React component `<PixelOffice />` renders an 1100×720 canvas with:
   - Top-row rooms (Conference, Boss Office, Kitchen) visually distinct.
   - Two rows of cubicles with clearly visible desks and monitors.
   - Right-side lounge area with at least couch, table, and one fun item (ping pong or bean bags).
   - Plants in at least 3–4 spots.

2. At least 3 agents (e.g. Sherlock, Sherlobster, Hercule Prawnro):
   - Are rendered as pixel characters.
   - Respond to status changes from a mocked or real `/api/employee-status` endpoint.
   - Walk to their desks when `working`.
   - Wander around when `idle`.

3. Bottom bar shows each agent with:
   - Color dot matching their shirt.
   - Name text.
   - Status text `Working` / `Idle`.

4. The entire scene uses only Canvas drawing calls (no external sprites) and is reasonably efficient on a modern browser (no obvious stutter on a typical laptop).

---

## Notes for ONECODE

- Focus on **clean separation** between:
  - State (agents, layout coordinates, status data), and
  - Rendering (pure functions drawing to `CanvasRenderingContext2D`).
- Provide a small **mock mode** for `/api/employee-status` (e.g. alternate statuses every N seconds) so the component can be tested without a backend.
- Document key coordinate choices (where each cubicle/room is) in comments or a simple `layout.ts` module.

This blueprint is meant to be detailed enough that you can go straight from here to production-quality React + Canvas code with minimal additional clarification.
