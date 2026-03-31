# Pixel Office – OpenCode × Supabase × Netlify Deployment Checklist

This doc tracks the remaining work to validate the hybrid deployment path and make Pixel Office actionable from OpenCode sessions.

## 1. Current State

- **Frontend**
  - Vite app with `npm run build` → `tsc -b && vite build`.
  - `netlify.toml` present with:
    - `build.command = "npm run build"`
    - `build.publish = "dist"`
    - Node 20 configured.
- **Backend**
  - Supabase project created.
  - Phase 1 schema applied successfully (no errors, no rows yet):
    - `agents`, `sessions`, `events`, `tasks`, `cooler_sessions`, `cooler_messages`, `scrum_runs`, `scrum_stage_events`, `artifacts`.
- **Frontend wiring**
  - `.env` contains Supabase URL and anon key.
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are expected in the Vite env.
  - `@supabase/supabase-js` added to `dependencies` in `package.json`.
  - `src/utils/supabaseClient.ts` created to expose a shared `supabase` client.

## 2. Supabase Client Wiring

Location: `src/utils/supabaseClient.ts`

- Imports `createClient` from `@supabase/supabase-js`.
- Reads `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- Exports a singleton `supabase` client for use in React components and hooks.

This is the main integration surface for OpenCode tasks that need to call Supabase.

## 3. Pending Tests / Validation Steps

These are the concrete checks we want OpenCode (or local dev) to run to confirm the wiring actually works.

### 3.1. Env + Client Sanity Check

**Goal:** Confirm the frontend can successfully talk to Supabase.

Tasks:
- [ ] Add a tiny debug function (or hook) that calls:
  - `supabase.from('agents').select('*').limit(1)`
- [ ] Run `npm run dev` locally.
- [ ] Hit a simple route or panel that triggers this query.
- [ ] Verify in the browser devtools that:
  - The request is sent to the correct Supabase URL.
  - No auth/env errors occur.

### 3.2. Create + Read Back a Cooler Session (End-to-End)

**Goal:** Prove that a cooler session created from the app is actually persisted in Supabase.

Tasks:
- [ ] Add a thin data-access helper (e.g. `src/hooks/useCoolerSessions.ts` or a `coolerApi.ts`) that can:
  - [ ] Insert a new `sessions` row with `kind = 'cooler'` and initial `status = 'active'`.
  - [ ] Insert the corresponding `cooler_sessions` row (1–1 with `sessions.id`).
  - [ ] Insert at least one `cooler_messages` row tied to that `cooler_session_id`.
- [ ] Trigger this flow from the frontend (e.g., a temporary "Create test cooler session" button in a dev-only panel).
- [ ] Verify in Supabase:
  - [ ] `sessions` has the new row.
  - [ ] `cooler_sessions` has the matching 1–1 row.
  - [ ] `cooler_messages` has at least one message tied to that session.

Success criteria:
- A cooler session initiated from the UI shows up in the Supabase tables without errors.

### 3.3. Read-Only Cooler Session List in UI

**Goal:** Expose Supabase-backed cooler sessions in the Pixel Office UI.

Tasks:
- [ ] Implement a query that lists recent `cooler_sessions` joined with their base `sessions` row (title/kind/status).
- [ ] Render a simple list component driven entirely by Supabase data.
- [ ] Confirm that newly created cooler sessions (from 3.2) appear in this list without a refresh of the backend.

### 3.4. Netlify Build + Env Propagation

**Goal:** Confirm that the production build on Netlify can still reach Supabase.

Tasks (once a Netlify site is wired):
- [ ] Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify site environment.
- [ ] Trigger a Netlify build (`npm run build` → `dist`).
- [ ] Open the deployed site and run the tests from 3.1–3.3 in production.

Success criteria:
- No missing-env or network errors in the Netlify-hosted build.

## 4. OpenCode-Facing Notes

When OpenCode (or any coding agent) is asked to work on Supabase/Netlify integration for Pixel Office, it should:

- Use `src/utils/supabaseClient.ts` as the single source of truth for the client.
- Respect `.env` / `VITE_` env variables and not hardcode Supabase URLs/keys.
- Implement new features by:
  - Adding thin data-access helpers (e.g., `coolerSessionsApi`), not scattering raw Supabase calls across components.
  - Writing minimal tests or scripts that can be run via `npm run dev` or small TS entrypoints under `scripts/`.

## 5. Status Summary

- [x] Supabase schema created (Phase 1 SQL applied).
- [x] Supabase client library added to `package.json`.
- [x] Shared Supabase client file added under `src/utils/`.
- [ ] Cooler session creation + persistence verified end-to-end.
- [ ] Cooler session list rendering from Supabase.
- [ ] Netlify build + Supabase connectivity validated in production.
