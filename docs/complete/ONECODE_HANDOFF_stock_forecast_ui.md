# Opencode Handoff: Pixel Office Stock Forecast UI & Evaluation Controls

## Goal

Build the **end-to-end UI** for the stock forecast workflow in Pixel Office and wire it into the existing backend API.

Focus areas:
1. A user-facing **Stock Forecast Dashboard** (create, list, stats).
2. An **Evaluate Due Stock Forecasts** control wired to the admin action endpoint.
3. A **historical chart** showing evaluation counts over time (from `activity_log`).
4. Integration into the existing React app (`src/`), using the existing Express backend (`server/index.ts`).

The server already exposes:
- `POST /api/stocks/forecasts`
- `GET /api/stocks/forecasts`
- `GET /api/stocks/forecasts/stats`
- `GET /api/stocks/forecasts/:id`
- `POST /api/admin/actions/evaluate-stock-forecasts`
- `GET /api/admin/activity`

Use these endpoints; do not invent new ones unless strictly necessary.

---

## 1. Frontend: Stock Forecast Dashboard

### 1.1. Route and Layout

Create a new route/page in the React frontend under `src/`:
- Path: `/stocks/forecasts`
- Suggested file: `src/pages/StockForecastDashboard.tsx` (or similar), wired into whatever routing mechanism `App.tsx` currently uses.

The dashboard should include three main sections:
1. **Create Forecast** form (top)
2. **My Forecasts** table/list (middle)
3. **Stats & Historical Chart** (bottom)

Assume a single default user (`user_id = 1`) for now; user management can be added later.

### 1.2. Create Forecast Form

Backed by `POST /api/stocks/forecasts`.

Fields:
- `symbol` (text input, required)
- `prediction_type` (select, required): `price`, `percentage_return`, or `direction`
- `predicted_price` (number input, optional; enabled only when `prediction_type === 'price'`)
- `predicted_direction` (select, optional; enabled only when `prediction_type === 'direction'`; options: `up`, `down`, `flat`)
- `horizon_days` (number input, default `14`)
- `target_date` (date input, optional; defaults to `today + horizon_days` on submit if left blank)
- `notes` (textarea, optional)

Behavior:
- On submit:
  - Disable the submit button and show a small loading indicator.
  - Send `POST /api/stocks/forecasts` with JSON body:

    ```jsonc
    {
      "symbol": "AAPL",
      "prediction_type": "price",
      "predicted_price": 210.5,
      "predicted_direction": null,
      "horizon_days": 14,
      "target_date": "2026-03-15",  // optional
      "notes": "Earnings optimism.",
      "user_id": 1
    }
    ```

- On success:
  - Clear the form (except maybe `symbol` and `prediction_type` for convenience).
  - Show a success message with a short summary (ticker + target date).
  - Refresh the **My Forecasts** list and **Stats**.
- On error:
  - Show a concise error message.

TypeScript types for the request and response should align with the existing API:

```ts
interface CreateForecastRequest {
  symbol: string;
  prediction_type: "price" | "percentage_return" | "direction";
  predicted_price?: number | null;
  predicted_direction?: "up" | "down" | "flat" | null;
  horizon_days?: number;
  target_date?: string; // ISO date
  notes?: string;
  user_id?: number; // default 1
}

interface StockForecast {
  id: number;
  user_id: number;
  ticker_id: number;
  ticker_symbol: string; // joined as alias
  created_at: string;
  target_date: string;
  horizon_days: number;
  prediction_type: string;
  predicted_price: number | null;
  predicted_return_pct: number | null;
  predicted_direction: string | null;
  baseline_price: number | null;
  status: string;
  evaluated_at: string | null;
  actual_price: number | null;
  actual_return_pct: number | null;
  absolute_error_price: number | null;
  absolute_error_pct: number | null;
  notes: string | null;
}
```

### 1.3. My Forecasts Table

Backed by `GET /api/stocks/forecasts`.

Call shape (for the default view):
- `GET /api/stocks/forecasts?user_id=1&limit=50&offset=0`

Columns (suggested):
- Ticker (`ticker_symbol`)
- Created (date)
- Target Date
- Type (price / % / direction)
- Prediction Summary (e.g. "$210.50", "+8%", "up")
- Status (pending / evaluated)
- Result (for evaluated only):
  - Actual price
  - Error (absolute price and/or %)

Behavior:
- Show loading state while fetching.
- Implement basic pagination or “Load more” if `total` > page size.
- Allow filtering by:
  - `status` (`pending`, `evaluated`, or all)
  - `symbol` (text input)
- When filters change, rebuild query string and refetch.

Example call with filters:

```http
GET /api/stocks/forecasts?user_id=1&status=pending&symbol=AAPL&limit=50&offset=0
```

### 1.4. Stats Panel

Backed by `GET /api/stocks/forecasts/stats`.

Call:
- `GET /api/stocks/forecasts/stats?user_id=1`

Display:
- `totalForecasts`
- `evaluatedCount`
- `meanAbsoluteErrorPrice`
- `meanAbsoluteErrorPct`
- `directionHitRate`

Formatting:
- Use sensible rounding (e.g. 2 decimals for prices and %).
- Show a textual summary, e.g.:

> "You’ve made 23 forecasts; 7 evaluated so far. Mean abs error: $1.23 (3.4%). Direction hit-rate: 71%."

Refresh stats whenever:
- A new forecast is created.
- Evaluations are run (see next section).

---

## 2. Admin Cockpit: Evaluate Button + Historical Chart

This section extends the **Assistant Cockpit** page (`/admin/assistant`) described in `ONECODE_HANDOFF_assistant_cockpit.md`.

### 2.1. Evaluate Due Forecasts Button

Backend endpoint (already present):
- `POST /api/admin/actions/evaluate-stock-forecasts`

Expected response shape (approximate):

```jsonc
{
  "ok": true,
  "evaluatedCount": 5,
  "errors": ["..."],
  "message": "Evaluated 5 forecast(s)."
}
```

Frontend behavior in `/admin/assistant`:
- Add a **Quick Actions** panel (if not already there).
- Button: **Evaluate due stock forecasts**.
  - On click:
    - Disable the button and show a small spinner.
    - `POST /api/admin/actions/evaluate-stock-forecasts`.
    - On success:
      - Show the `message` text (or a generic success with `evaluatedCount`).
      - Refresh:
        - `GET /api/admin/activity`
        - `GET /api/stocks/forecasts/stats?user_id=1` (so the stats panel on `/stocks/forecasts` stays fresh if you’re there).
    - On error:
      - Show error message, re-enable button.

Authentication:
- If `ADMIN_ACCESS_TOKEN` is configured, this call should include the `x-admin-token` header.
  - Optionally read from a `VITE_ADMIN_ACCESS_TOKEN` env var in the frontend.

### 2.2. Historical Chart (Evaluation Timeline)

Goal: Show a simple timeline chart at the bottom of the admin cockpit’s stock section that tracks **evaluation runs over time**.

Data source:
- `GET /api/admin/activity`
- Filter events where `type === 'stock_forecast_evaluated'`.
- Use their `created_at` plus `details.evaluated` fields.

Assumed `activity_log` schema (as described previously):

```sql
CREATE TABLE activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id BIGINT NULL,
  type VARCHAR(64) NOT NULL,
  description TEXT NULL,
  details JSON NULL
);
```

Example row:

```jsonc
{
  "id": 123,
  "created_at": "2026-02-20T03:10:00Z",
  "type": "stock_forecast_evaluated",
  "description": "Evaluated 5 pending forecasts",
  "details": { "evaluated": 5, "errors": 1 }
}
```

Chart behavior:
- X-axis: time (e.g. grouped by day).
- Y-axis: number of forecasts evaluated in each run or per day.
- Visual type: line chart or bar chart (whichever is easiest with minimal deps).

Implementation guidance:
- Prefer a lightweight charting solution. Two options:
  - **Option A:** Minimal dependency: use a simple SVG or `<canvas>` chart coded by hand (small line or bar graph).
  - **Option B:** Use a tiny chart library already allowed in the stack (if you choose to add something like `chart.js` or `recharts`, ensure it’s added as a dependency and imported cleanly).

Transforming activity events to chart data:

```ts
interface ActivityEvent {
  id: number;
  created_at: string;
  type: string;
  description?: string;
  details?: { evaluated?: number; [key: string]: any } | null;
}

interface ChartPoint {
  date: string; // e.g. "2026-02-20"
  evaluatedSum: number;
}

function buildEvaluationTimeline(events: ActivityEvent[]): ChartPoint[] {
  const byDate: Record<string, number> = {};

  for (const ev of events) {
    if (ev.type !== "stock_forecast_evaluated") continue;
    const d = ev.created_at.split("T")[0];
    const evaluated = (ev.details && typeof ev.details.evaluated === "number")
      ? ev.details.evaluated
      : 0;
    byDate[d] = (byDate[d] || 0) + evaluated;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, evaluatedSum]) => ({ date, evaluatedSum }));
}
```

Rendering:
- Under the **Quick Actions** area, add a **"Stock Forecast Evaluation Timeline"** section.
- Show the chart; if there is no data, display a short message like:

> "No stock forecast evaluations yet. Run an evaluation to start the timeline."

---

## 3. Integration Notes

- **Routing:**
  - Ensure `/stocks/forecasts` is discoverable via navigation (e.g. a link from a main menu or dev panel).
  - `/admin/assistant` remains an internal view; stock-related sections should be visually grouped on that page.

- **Config:**
  - Respect `ADMIN_ACCESS_TOKEN` and optional `VITE_ADMIN_ACCESS_TOKEN` if configured.
  - For development without a token, backend already allows admin routes when `NODE_ENV !== 'production'`.

- **State Refresh:**
  - After evaluation runs, refresh both:
    - Activity feed (`/api/admin/activity`)
    - Stock stats (`/api/stocks/forecasts/stats`).

- **Error Handling:**
  - Be explicit and concise: surface the `message` or `error` from JSON responses.
  - Don’t let one failing panel (e.g. chart) break the whole page; panels should manage their own error states.

---

## 4. Deliverables Checklist for Opencode

1. **New page/component for `/stocks/forecasts`:**
   - Create Forecast form wired to `POST /api/stocks/forecasts`.
   - My Forecasts table wired to `GET /api/stocks/forecasts`.
   - Stats panel wired to `GET /api/stocks/forecasts/stats`.

2. **Admin cockpit enhancements at `/admin/assistant`:**
   - Evaluate Due Stock Forecasts button wired to `POST /api/admin/actions/evaluate-stock-forecasts`.
   - After click, refresh activity + stats.

3. **Historical chart:**
   - Built from `GET /api/admin/activity`, using `stock_forecast_evaluated` events.
   - Rendered on `/admin/assistant` below the Quick Actions.

4. **Types & DX:**
   - Add TypeScript types for API responses (forecasts, stats, activity events).
   - Keep components small and composable.

5. **Validation/Test Notes:**
   - Manually verify creating a forecast updates the list and stats.
   - Run the evaluate action and confirm:
     - API returns evaluated count.
     - Activity feed shows a new `stock_forecast_evaluated` event.
     - Historical chart updates accordingly.
