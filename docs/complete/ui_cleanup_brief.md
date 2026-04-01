# Opencode Brief – Pixel Office UI Cleanup (Public-Facing Tightening)

**Direct instruction for Opencode:**

- Use this brief as the spec for tightening the public-facing UI.
- The following environment variables are already defined in Netlify (and can be used via Vite):
  - `VITE_PUBLIC_MODE`
  - `VITE_LAB_MODE`
- Please:
  1. Add a small `src/config/env.ts` helper that exposes `PUBLIC_MODE` and `LAB_MODE` booleans from those env vars.
  2. Refactor the Pixel Office UI to conditionally show/hide internal dev controls (e.g., Show Parameters, Terminal, Admin Assistant, labs) based on `LAB_MODE`.
  3. Keep benign office settings (e.g., Live Mode, Show Agent Names) visible in both public and lab modes.
  4. Move experimental tools (e.g., criminology lab, genealogy lab, terminal) under a clearly labeled Labs / Working Tools section, following the details below.

---

## Goal
Polish the public-facing UI so that visitors see a stable, coherent experience with no legacy debug surfaces, broken tools, or confusing links. Keep all deep/internal tools accessible via clearly marked "lab" affordances, and preserve useful admin/office toggles behind a clear mode switch.

---

## 1. Tighten Legacy Debug Controls (Without Losing Admin Toggles)

### Tasks

1. **Refine "Show Parameters" panel behavior**
   - Locate the "Show Parameters" button and panel (likely in `src/components/PixelOffice.tsx`).
   - Identify which elements are:
     - **Admin/office toggles we want to keep** (e.g., *Live Mode*, *Show Agent Names*, other harmless checkboxes).
     - **Legacy debug surfaces we want to hide** (raw config dumps, internal URLs, low-level links, etc.).
   - Refactor so that:
     - Public-facing builds **do not** expose raw parameters, internal URLs, or debug links.
     - Useful admin toggles (e.g., *Live Mode*, *Show Agent Names*) remain accessible, either:
       - Inline in the main UI controls, or
       - In a small "Office Settings" panel that is **kept** in both modes.

2. **Admin Assistant link placement**
   - If an "Admin Assistant" link currently lives inside the Show Parameters panel, move it to a clearer home:
     - Either under an "Admin" / "Labs" / "Working Tools" section, or
     - Gated behind a `LAB_MODE` flag so it is not visible in the fully public view.
   - Ensure the Admin Assistant entry does not expose sensitive routes or raw backend tooling.

3. **Audit for other debug-only toggles**
   - Look for:
     - "dev only" / "debug" labels
     - Buttons that open raw JSON views, IDs, or internal helper links.
   - Either remove them from the public build or gate them behind a `LAB_MODE` flag (env-driven) that is off for Netlify.

4. **Locate the "Terminal" link and tighten behavior**
   - Search the codebase for the UI element labeled **"Terminal"** and identify:
     - Which component renders it
     - Which route or URL it points to
   - Confirm whether this is intended for public use or was a development/debug surface.
   - If it is debug-only or currently nonessential:
     - Hide it in public mode, or
     - Move it under the Labs / Working menu (see section 3) and clearly label it as experimental/advanced.
   - If it remains visible in public mode, ensure it does not expose sensitive links, raw IDs, or backend-only functionality.

---

## 2. Criminology Lab – Fix or Hide Broken Diagram Generator

**Current issue:**
- The criminology lab link points to a non-working mermaid diagram generator.

### Tasks

1. **Identify the criminology lab entry**
   - Locate where the criminology lab is linked in the UI (likely a nav card or section).
   - Find the underlying component / route for the mermaid diagram generator.

2. **Decide behavior for public build:**
   - Short term: hide or disable the criminology lab link in public mode.
   - Longer term (optional): fix the mermaid generator to a stable, minimal working example.

3. **Implementation suggestion:**
   - Use the `PUBLIC_MODE` / `LAB_MODE` flags from `src/config/env.ts`.
   - If `PUBLIC_MODE` is true:
     - Do not render the criminology lab link, or
     - Render it but point to a simple "Coming soon" / read-only description instead of the broken generator.

---

## 3. Genealogy Lab – Move into a "Working Labs" Dropdown

**Goal:**  
Keep advanced/experimental tools accessible but clearly separated from the main public view.

### Tasks

1. **Create a "Labs" or "Working Tools" dropdown/menu**
   - e.g., a top-right nav dropdown: "Labs" → entries like:
     - Genealogy Lab
     - Criminology Lab (when it’s truly working)
     - Terminal or Admin tools (if we keep them visible but clearly marked).
     - Other experimental tools as they come online.

2. **Move Genealogy Lab link**
   - Remove the direct/primary-link positioning for the Genealogy Lab from the main surface.
   - Add it as a child item under the new Labs / Working Tools dropdown.

3. **Labeling**
   - Add a small "Experimental" or "Working" note in the menu item label or tooltip so users know it’s an advanced/rough surface.

---

## 4. Public vs Lab Mode Wiring (Lightweight)

### Tasks

1. **Introduce a simple mode helper**
   - In `src/config/env.ts` (to be created by Opencode):
     ```ts
     const rawPublic = import.meta.env.VITE_PUBLIC_MODE;
     const rawLab = import.meta.env.VITE_LAB_MODE;

     export const PUBLIC_MODE = rawPublic === 'true';
     export const LAB_MODE = rawLab === 'true' || (!PUBLIC_MODE && rawLab !== 'false');
     ```
   - This ensures:
     - Netlify prod: `PUBLIC_MODE=true`, `LAB_MODE=false` → public view only.
     - Local dev (if unset): defaults to lab-friendly behavior.

2. **Use PUBLIC_MODE / LAB_MODE to gate**
   - Show/hide in public mode:
     - Raw parameter dumps, internal URLs, legacy debug panels.
     - Criminology Lab link (until it’s working).
     - "Terminal" link and any other rough/experimental panels.
   - **Do not hide** core office controls that are useful in both modes, such as:
     - Live Mode toggle
     - Show Agent Names
     - Other simple, non-sensitive checkboxes or view options.

---

## 5. Quick Safety & UX Check

After changes:

1. Run the Netlify build locally:
   ```bash
   npm run build
   ```
2. Open the built version (or the Netlify preview) and verify:
   - No raw "Show Parameters" debug panel in public mode.
   - Live Mode / Show Agent Names (and similar benign office settings) are still available and working.
   - No clearly broken criminology lab view; if present, it’s clearly marked as "Coming soon" or hidden.
   - Genealogy Lab (and optionally Terminal/Admin surfaces) reachable only via the Labs / Working menu and clearly labeled as experimental/advanced.
   - No obvious internal URLs, keys, or debug info visible.

This brief should give Opencode a clear, surgical path to tightening the public-facing UI while preserving useful office settings and an accessible lab space for internal experimentation.