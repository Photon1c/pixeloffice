Build me a 2D pixel art office visualization for my AI agents using HTML Canvas and React (or plain JavaScript). This is a fun, game-like view of my AI team "working" in a virtual office.

What it should have:
Checkered dark navy floor (retro game vibe)
Top row: 3 rooms — Conference Room (round table + chairs), Boss Office (executive desk, couch, bookshelf), Kitchen (white cabinets, fridge, coffee machine)
2 rows of cubicles (4x2 grid) with corridors. Each cubicle: desk with blue-screen monitor, unique desk item per agent, name plate, green/red status dot
Right side: Lounge — couch, coffee table, water cooler, bean bags, ping pong table, whiteboard
Plants/trees scattered around
Each agent is a color-coded pixel art character (~20x40px scaled 2x) with hair, face, colored shirt, dark pants. 2-frame walking animation (arm swing + leg movement). Sitting animation when "working" (arms forward typing).

Behavior: When status = "working" → character walks to their desk and sits. When "idle" → character wanders the office (kitchen, lounge, corridors). Poll a /api/employee-status endpoint every 5 seconds for status updates.

Bottom bar: badges showing each agent name, color dot, and Working/Idle status.

Technical: HTML5 Canvas, requestAnimationFrame, all pixel art via fillRect (no external images), dark theme, ~1100x720 canvas, JetBrains Mono font for labels.

Make it feel like a retro office sim RPG. Each agent gets their own color and unique desk item (globe for researcher, books for writer, coffee for developer, palette for designer, camera for video, waveform for motion, shield for QA, fire for scout).
