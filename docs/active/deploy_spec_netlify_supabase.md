# Pixel Office Deployment Spec (Netlify + Supabase Hybrid)

This document defines the **Phase 1** deployment shape for Pixel Office:

- **Frontend:** Netlify (build & host the Vite app)
- **Backend / data / auth / storage / realtime:** Supabase

The goal is to give Pixel Office a real backend spine (Supabase) while keeping the familiar Netlify workflow for the UI.

---

## 1. Project Location & Key Directories

- Root: `/home/sherlockhums/apps/pixelworld/pixel_office`

Key directories (approx sizes):
- `node_modules/` — ~302M (local dev only, **never deploy**)
- `dist/` — ~3.2M (production build output)
- `public/` — ~2.4M (static assets)
- `server/` — ~916K (server/orchestration code; to be evaluated for serverless use)
- `assets/` — ~860K (additional assets)
- `src/` — ~500K (frontend source)
- `docs/` — ~732K (internal docs)

Only `dist/` (or the **source + lockfile**) should be involved in deployment. `node_modules/` stays local.

---

## 2. Deployment Shape (High-Level)

### Frontend: Netlify

Netlify is responsible for:
- Installing dependencies
- Running the Vite build
- Serving the built site from `dist/`
- Optionally providing a thin serverless/edge layer close to the UI

### Backend: Supabase

Supabase is responsible for:
- Persistent data (Postgres)
- Auth
- Storage for artifacts (logs, small outputs, attachments)
- Realtime subscriptions (presence, live sessions/state)

This is **not** Supabase vs Netlify; it’s a **hybrid** where:
- Netlify = deployment + hosting for the UI
- Supabase = backbone for state, events, and records

---

## 3. Netlify Spec (Frontend)

### 3.1. What Netlify Builds

Repository contents that Netlify should see:
- Include:
  - `src/`
  - `public/`
  - `server/` (only if adapted into Netlify Functions later)
  - `package.json`
  - `package-lock.json`
  - `vite.config.ts`
  - `tsconfig.json`
  - `docs/` (optional; not required for runtime)
- Exclude from the deploy artifact:
  - `node_modules/` (Netlify runs `npm install`)
  - Local build products if using CI (`dist/` is generated during build)
  - Local logs and caches (`server.log`, heavy dev-only artifacts)

### 3.2. Netlify Build Settings (Phase 1)

Draft settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** set via `netlify.toml` or `.nvmrc` (e.g. `20`)

Example `netlify.toml` (to create later):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

Serverless/edge functions are **out of scope** for Phase 1. They can be added later if needed, possibly by adapting pieces of `server/`.

### 3.3. Netlify Responsibilities

Use Netlify for:
- Hosting the Pixel Office UI
- Branch/preview deploys
- Rollbacks
- A thin HTTP edge layer if/when we wire it up to Supabase or other services

Netlify should **not** be the primary data store or long-term log sink.

---

## 4. Supabase Spec (Backend)

Supabase will back the core Pixel Office entities.

### 4.1. Phase 1 Tables (Backbone)

Start small and focus on the spine of the office:

- `agents`
- `tasks`
- `sessions`
- `events`
- `cooler_sessions`
- `cooler_messages`
- `scrum_runs`
- `scrum_stage_events`
- `artifacts`

Possible Phase 2 tables (later):
- `repo_queries`
- `benchmark_runs`
- `model_role_mappings`

### 4.2. What Belongs in Supabase

Use Supabase when a feature needs:
- Persistence
- Relationships between entities
- User/session state
- Live subscriptions / realtime
- Storage (artifacts, logs worth keeping)
- Audit trails or history

Keep **out** of Supabase initially:
- Raw dev caches
- Large transient logs
- Bulky test artifacts
- Anything cheaper to regenerate than to store

Supabase is the **source of truth**, not a dumping ground.

### 4.3. Env Variables (Frontend → Supabase)

The frontend will need environment variables (example names):

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

These will be configured in:
- Netlify site environment variables

The frontend then uses these to initialize the Supabase client.

---

## 5. Minimal Deployable Bundle (Phase 1)

When ready to deploy Pixel Office UI:

1. **Local check**
   - `npm install`
   - `npm run build`
   - Verify `dist/` works locally.

2. **Netlify**
   - Connect the repo containing `pixel_office`.
   - Set build = `npm run build`, publish = `dist`.
   - Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify env.

3. **Supabase**
   - Create the project.
   - Define the Phase 1 tables.
   - Generate URL + anon key.
   - (Later) add Row Level Security and policies once users/auth come into play.

The huge `node_modules/` directory (≈302M) stays strictly local; it is never part of the deployed artifact.

---

## 6. Next-Time Checklist

When you come back to Pixel Office deployment:

- [x] Open `package.json` and confirm the exact `build`/`dev` scripts. (Confirmed: `build` = `tsc -b && vite build`, `dev` = `vite`.)
- [ ] Create or finalize `netlify.toml` with the settings above.
- [ ] Stand up a Supabase project and define Phase 1 tables.
- [ ] Wire the frontend to Supabase via env vars and a small client wrapper.
- [ ] Decide whether any part of `server` should migrate to Netlify Functions or Supabase Edge Functions (Phase 2).

This spec is intentionally lean and aligned with the hybrid recommendation: **Netlify for the frontend, Supabase for the backend.**
