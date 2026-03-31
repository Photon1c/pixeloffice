# Opencode Handoff: Pixel Office Assistant Cockpit

## Purpose

Create an internal "assistant cockpit" in Pixel Office so that:
- Cheddar and Sherlock can quickly see **what's in the database** and **what the app is doing**.
- We have a single place to:
  - Inspect tables and recent rows
  - Trigger internal maintenance/actions (like evaluating stock forecasts)
  - View a small activity log

This is **not** a public feature. It can be dev-only or behind a simple secret token / environment flag.

The implementation should be grounded in the existing stack:
- Backend: `express` server in `server/index.ts`, using `getPool` / `getConfig` from `src/pixel_memory/config.ts`.
- Frontend: React + Vite in `src/`.

---

## High-Level Requirements

1. Add a new internal route in the backend:
   - `GET /api/admin/summary`
   - `GET /api/admin/activity`
   - Optionally: `POST /api/admin/actions/evaluate-stock-forecasts` (stub for now)

2. Add a new frontend page:
   - Route: `/admin/assistant` (or `/debug/assistant`)
   - Components to show:
     - **Database Overview** (tables, counts)
     - **Recent Activity** (simple log feed)
     - **Quick Actions** (buttons to hit internal endpoints such as evaluation jobs)

3. Respect a simple guard for access (dev-only):
   - For now, it's acceptable to:
     - Serve this route only when `NODE_ENV !== 'production'`, or
     - Require a header/token set via environment variable (e.g. `ADMIN_ACCESS_TOKEN`).

---

## Backend: New Admin Endpoints

Extend `server/index.ts` with:

### 1. Admin Summary Endpoint

**Route:** `GET /api/admin/summary`

**Goal:** Return a compact JSON summary of key DB tables and counts.

**Behavior:**
- Use the same `runDbQuery` helper to:
  - List all tables via `SHOW TABLES` (MySQL case).
  - For each table, run a lightweight `SELECT COUNT(*)`.
- Return an object like:

```jsonc
{
  "tables": [
    {
      "name": "users",
      "rowCount": 42
    },
    {
      "name": "stock_tickers",
      "rowCount": 17
    },
    {
      "name": "stock_forecasts",
      "rowCount": 63
    }
  ]
}
```

**Notes:**
- Handle errors per-table gracefully; if a count fails, include `{ name, error }` instead of throwing.

### 2. Admin Activity Endpoint

**Route:** `GET /api/admin/activity`

**Assumption:** We'll introduce a minimal `activity_log` table, but this can initially return a static/dummy feed until the table exists.

**Target schema (for later migration):**

```sql
CREATE TABLE activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id BIGINT NULL,
  type VARCHAR(64) NOT NULL,
  description TEXT NULL,
  details JSON NULL
);

CREATE INDEX idx_activity_created_at ON activity_log (created_at DESC);
```

**Initial behavior:**
- If `activity_log` exists:
  - `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50;`
  - Return list of events.
- If not:
  - Return a small static array with a single message indicating activity logging is not yet wired.

**Response shape example:**

```jsonc
{
  "events": [
    {
      "id": 123,
      "created_at": "2026-02-20T01:05:00Z",
      "type": "stock_forecast_evaluated",
      "description": "Evaluated 12 pending forecasts",
      "details": {
        "evaluated": 12,
        "errors": 0
      }
    }
  ]
}
```

### 3. Quick Action: Evaluate Stock Forecasts (Stub)

**Route:** `POST /api/admin/actions/evaluate-stock-forecasts`

**Goal:** Provide a single button in the cockpit that triggers evaluation of due stock forecasts, as described in `ONECODE_HANDOFF_stock_forecast.md`.

**MVP behavior:**
- For now, it's acceptable to:
  - Check for existence of `stock_forecasts` table.
  - Return `{ ok: true, message: "Evaluation job stubbed; implementation pending." }`.

**Future behavior (for later Opencode runs):**
- Implement the actual evaluation logic:
  - Find `status = 'pending'` and `target_date <= NOW()`.
  - Fetch prices, compute errors, update rows.
  - Insert a row into `activity_log` summarizing the run.

**Security:**
- Protect this endpoint behind the same guard as the other admin routes.

---

## Backend: Simple Access Guard

Add a reusable middleware, e.g. `requireAdmin` inside `server/index.ts`:

```ts
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = process.env.ADMIN_ACCESS_TOKEN;

  // If no token configured, allow access only in non-production for now.
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Admin access not configured" });
    }
    return next();
  }

  const header = req.header("x-admin-token");
  if (header !== token) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
```

Apply it to all `/api/admin/...` routes.

---

## Frontend: Assistant Cockpit Page

Create a new React route under `src/`:
- Suggested file: `src/components/AdminAssistant.tsx` or `src/pages/AdminAssistant.tsx`.
- Wire into routing from `App.tsx` (see existing routing pattern).

### Route & Navigation

- Path: `/admin/assistant`
- Add a simple link from any dev-only section (e.g. a small link in a footer or a keyboard-only entry).

### Layout Sections

1. **Database Overview Panel**
   - Fetch from `GET /api/admin/summary`.
   - Show a table:

     | Table           | Row count | Notes |
     |-----------------|-----------|-------|
     | users           | 42        |       |
     | stock_tickers   | 17        |       |
     | stock_forecasts | 63        |       |

   - If an entry has an `error` field, show that instead of `rowCount`.

2. **Recent Activity Feed**
   - Fetch from `GET /api/admin/activity`.
   - Display latest ~50 events as a list:

     - `[2026-02-20 01:05] stock_forecast_evaluated – Evaluated 12 pending forecasts`
     - `[2026-02-20 00:58] system_startup – Pixel Office Live server started`

   - If no real events available, show a placeholder message (e.g. "Activity logging not yet configured").

3. **Quick Actions Panel**
   - Button: **Evaluate due stock forecasts**
     - On click: `POST /api/admin/actions/evaluate-stock-forecasts`.
     - Show success/error toast or inline status.
   - Future: more buttons can be added (e.g. "Refresh schema cache", "Run DB smoke test").

### Frontend Implementation Notes

- Use the existing React style used in `src/App.tsx` and `components/`.
- Prefer TypeScript types for responses:

```ts
type AdminTableSummary = {
  name: string;
  rowCount?: number;
  error?: string;
};

type AdminSummaryResponse = {
  tables: AdminTableSummary[];
};

interface ActivityEvent {
  id: number;
  created_at: string;
  type: string;
  description?: string;
  details?: any;
}

type AdminActivityResponse = {
  events: ActivityEvent[];
};
```

- Make the page resilient:
  - Show loading / error states for each panel independently.

- For now, it's okay to call the admin endpoints without the `x-admin-token` header in dev; when `ADMIN_ACCESS_TOKEN` is set, the UI should send that header from an environment variable or config (e.g. `VITE_ADMIN_ACCESS_TOKEN`), but this wiring can be a follow-up task.

---

## Integration with Stock Forecast Workflow

Once the tables from `ONECODE_HANDOFF_stock_forecast.md` exist:

- The **Database Overview** panel will naturally surface:
  - `stock_tickers` and `stock_forecasts` with their row counts.

- The **Quick Actions** panel's "Evaluate due stock forecasts" button will:
  - Eventually trigger the full evaluation job, and
  - The result will be recorded into `activity_log`, appearing in the **Recent Activity** feed.

This creates a shared cockpit where:
- Cheddar can visually confirm the stock workflow is populated and running.
- Sherlock can reference concrete counts and activity when journaling or debugging.

---

## Handoff Notes for Opencode

1. **Backend:**
   - Implement `requireAdmin` middleware in `server/index.ts`.
   - Add the routes:
     - `GET /api/admin/summary`
     - `GET /api/admin/activity`
     - `POST /api/admin/actions/evaluate-stock-forecasts` (stub).
   - Use existing `runDbQuery` and `getPool` utilities; do **not** introduce a new DB abstraction.

2. **Schema (optional initial pass):**
   - If migrations are in place for Pixel Office, add a migration for `activity_log` as defined.
   - If not, either:
     - Implement a small `scripts/migrate-activity-log.ts`, or
     - Gate the `activity_log` read with a table-existence check.

3. **Frontend:**
   - Add `/admin/assistant` route and page component under `src/`.
   - Implement the three panels described with basic styling consistent with existing UI.
   - Wire fetch calls to the new admin endpoints.

4. **Config:**
   - Add optional support for `ADMIN_ACCESS_TOKEN` in the backend.
   - Optionally, add a `VITE_ADMIN_ACCESS_TOKEN` in the frontend and pass it via `x-admin-token` header.

5. **Testing / Validation:**
   - Verify that in dev mode, `/admin/assistant` loads and shows table counts from MySQL.
   - Confirm that the admin endpoints handle missing tables gracefully.
   - Confirm the quick action endpoint returns a clear stubbed message.
