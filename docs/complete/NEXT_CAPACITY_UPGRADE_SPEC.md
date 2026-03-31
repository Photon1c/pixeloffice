# Pixel Office - Capacity Analytics & Agent Capacity Cards (Next Upgrade Spec)

## Context

The `pixel_memory` task manager and daily planning system is live. We already:
- Generate an AI daily plan and persist it to `daily_plans` + `daily_plan_items`.
- Expose core task and daily plan APIs.
- Track completed items via `tasks.status`, and (per the 2026-02-20 `nextupgrade.md` patch) have added a `completed_at` field to `daily_plan_items` and a first analytics query.
- Implemented a basic capacity analytics endpoint:
  - `GET /api/analytics/capacity` returning, per `plan_date`:
    - `total_allocated_minutes` (sum of `dpi.allocated_minutes`)
    - `executed_minutes` (sum of `dpi.allocated_minutes` where `tasks.status = 'done'`).

This spec focuses on surfacing that data in a structured way for:
1. A more flexible capacity analytics API.
2. Agent-level "capacity cards" when an agent card is opened.
3. A global capacity discipline indicator in the Pixel Office UI.

---

## Goals

1. **API**: Provide structured endpoints that frontends (and external tools) can use to query capacity discipline over time, with optional date ranges.
2. **Agent UX**:
   - When viewing an agent card, show a small capacity card summarizing their plan vs execution for today (and optionally, last few days).
3. **Global UX**:
   - Provide a compact global capacity indicator (today-focused) that can be rendered in the top bar/dashboard.

Non-goals for this patch:
- Any changes to the AI planning prompt or scheduling logic.
- Multi-user permission model; we assume a single primary user for now, but we design the API to *optionally* support `user_id` later.

---

## API Changes

### 1. Extend `/api/analytics/capacity`

**Existing implementation (already in `server/index.ts`):**

```ts
app.get("/api/analytics/capacity", async (req, res) => {
  try {
    const results = await runDbQuery(`
      SELECT
        dp.plan_date,
        SUM(dpi.allocated_minutes) AS total_allocated_minutes,
        SUM(CASE WHEN t.status = 'done' THEN dpi.allocated_minutes ELSE 0 END) AS executed_minutes
      FROM daily_plans dp
      JOIN daily_plan_items dpi ON dp.id = dpi.daily_plan_id
      JOIN tasks t ON dpi.task_id = t.id
      GROUP BY dp.plan_date
      ORDER BY dp.plan_date DESC
    `);
    res.json({ capacity: results });
  } catch (error: any) {
    console.error("Analytics capacity error:", error);
    res.status(500).json({ error: error.message || "Failed to get capacity analytics" });
  }
});
```

**Planned enhancements (backwards compatible):**

- Support optional filters via query params:
  - `from` (YYYY-MM-DD)
  - `to` (YYYY-MM-DD)
  - `limit` (integer, number of most recent days to return)
- Add `completion_ratio` field in the response per day.

**Proposed behavior:**

- If `from`/`to` are provided, we add a `WHERE dp.plan_date BETWEEN ? AND ?` clause.
- If `limit` is provided, we append `LIMIT ?` after the `ORDER BY`.
- If neither `from`/`to` nor `limit` is provided, we return the full history (current behavior), ordered `DESC` by `plan_date`.

**Response shape (unchanged keys, plus ratio):**

```jsonc
{
  "capacity": [
    {
      "plan_date": "2026-02-21",
      "total_allocated_minutes": 420,
      "executed_minutes": 315,
      "completion_ratio": 0.75
    },
    // ...more days
  ]
}
```

Implementation notes:
- Compute `completion_ratio` in Node, not SQL, to keep the query portable and simple:
  - `ratio = executed_minutes && total_allocated_minutes ? executed_minutes / total_allocated_minutes : 0`.

### 2. New: `GET /api/analytics/capacity/today`

A focused endpoint optimized for the UI, returning just today's numbers.

**Route:**

```http
GET /api/analytics/capacity/today
```

**Behavior:**
- Determine `today` as `new Date().toISOString().split("T")[0]` (server local time is acceptable for now).
- Query capacity for that date only, using the same core aggregation as `/api/analytics/capacity`.
- If no plan exists for today, return `{"capacity": null}`.

**Response:**

```jsonc
{
  "capacity": {
    "plan_date": "2026-02-22",
    "total_allocated_minutes": 450,
    "executed_minutes": 180,
    "completion_ratio": 0.4
  }
}
```

**Error behavior:**
- On DB/other errors, return 500 with `{ error: string }`.

> Note: For now we treat capacity as global (all tasks). If we later introduce per-agent ownership of tasks, we can extend this endpoint with an optional `user_id` or `agent_id` query param and add a `WHERE` filter in the SQL.

---

## Frontend Changes

We assume the existing React/Vite frontend with a dashboard and agent cards. This patch introduces two UI surfaces:

1. **Global Capacity Indicator** – a small widget in the top bar/dashboard.
2. **Agent Capacity Card** – shown inside an agent's details panel when the card is clicked.

The actual UI polish (colors, fonts) can be iterated later; this spec focuses on data flow and minimal layout.

### 1. Hook: `useCapacityAnalytics`

Create a reusable hook for capacity data in `src/hooks/useCapacityAnalytics.ts`:

**Responsibilities:**
- Fetch `/api/analytics/capacity/today` for the global indicator.
- Optionally support fetching `/api/analytics/capacity?from=...&to=...&limit=...` when we want history (e.g., a mini trend chart).

**Sketch:**

```ts
import { useEffect, useState } from "react";

export interface CapacityDay {
  plan_date: string;
  total_allocated_minutes: number;
  executed_minutes: number;
  completion_ratio: number;
}

interface UseCapacityAnalyticsResult {
  today: CapacityDay | null;
  history: CapacityDay[];
  loading: boolean;
  error: string | null;
}

export function useCapacityAnalytics(options?: { days?: number }): UseCapacityAnalyticsResult {
  const [today, setToday] = useState<CapacityDay | null>(null);
  const [history, setHistory] = useState<CapacityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [todayRes, historyRes] = await Promise.all([
          fetch("/api/analytics/capacity/today"),
          fetch(`/api/analytics/capacity?limit=${options?.days ?? 7}`),
        ]);

        if (!todayRes.ok) throw new Error("Failed to load today's capacity");
        if (!historyRes.ok) throw new Error("Failed to load capacity history");

        const todayJson = await todayRes.json();
        const historyJson = await historyRes.json();

        if (cancelled) return;

        setToday(todayJson.capacity ?? null);
        setHistory(historyJson.capacity ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load capacity analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [options?.days]);

  return { today, history, loading, error };
}
```

### 2. Global Capacity Indicator Component

New component: `src/components/GlobalCapacityIndicator.tsx`.

**Behavior:**
- Uses `useCapacityAnalytics({ days: 7 })`.
- Displays a one-line summary + a simple progress bar.

**Sketch:**

```tsx
import React from "react";
import { useCapacityAnalytics } from "../hooks/useCapacityAnalytics";

export const GlobalCapacityIndicator: React.FC = () => {
  const { today, loading, error } = useCapacityAnalytics({ days: 7 });

  if (loading) return <div>Capacity: loading...</div>;
  if (error) return <div>Capacity: error</div>;
  if (!today) return <div>Capacity: no plan for today</div>;

  const { total_allocated_minutes, executed_minutes, completion_ratio } = today;
  const pct = Math.round((completion_ratio || 0) * 100);

  let color = "#22c55e"; // green
  if (pct < 50) color = "#ef4444"; // red
  else if (pct < 80) color = "#f97316"; // amber

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 220 }}>
      <div style={{ fontSize: 12 }}>
        Today: {executed_minutes} / {total_allocated_minutes} min ({pct}%)
      </div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 9999 }}>
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: color,
            height: "100%",
            borderRadius: 9999,
            transition: "width 0.2s ease-out",
          }}
        />
      </div>
    </div>
  );
};
```

**Integration:**
- Import and render this in the main app shell, e.g. in `App.tsx`'s top bar/toolbar.

### 3. Agent Capacity Card

When clicking an agent card in Pixel Office (e.g., in the existing agent detail panel), we want to show a small capacity panel.

Because tasks are currently *global* (not assigned to a specific agent), v1 of the Agent Capacity Card will:
- Show **global** capacity stats (same as the global indicator), but contextualized to that agent.
- This keeps implementation simple while still useful.

Later, once `tasks` have ownership (e.g. `assigned_to_user_id` or `agent_id`), we can:
- Add `user_id`/`agent_id` filters to the capacity endpoints.
- Have each card display *their* own capacity discipline.

**New component:** `src/components/AgentCapacityCard.tsx`.

**Props:**
- `agentName: string` (or a small agent model type if you have one).

**Sketch:**

```tsx
import React from "react";
import { useCapacityAnalytics } from "../hooks/useCapacityAnalytics";

interface AgentCapacityCardProps {
  agentName: string;
}

export const AgentCapacityCard: React.FC<AgentCapacityCardProps> = ({ agentName }) => {
  const { today, loading, error } = useCapacityAnalytics({ days: 7 });

  if (loading) return <div>Loading capacity...</div>;
  if (error) return <div>Error loading capacity</div>;
  if (!today) return <div>No plan for today.</div>;

  const { plan_date, total_allocated_minutes, executed_minutes, completion_ratio } = today;
  const pct = Math.round((completion_ratio || 0) * 100);

  return (
    <div style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        Capacity for <strong>{agentName}</strong> on {plan_date}
      </div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        Executed <strong>{executed_minutes}</strong> / {total_allocated_minutes} minutes ({pct}%)
      </div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 9999 }}>
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: "#0ea5e9",
            height: "100%",
            borderRadius: 9999,
          }}
        />
      </div>
    </div>
  );
};
```

**Integration:**
- Wherever the agent detail panel is rendered (e.g. `src/components/PixelOffice.tsx` or a nested component), import and render `<AgentCapacityCard agentName={agent.name} />` in the expanded view.

---

## Edge Cases & Notes

- **No plan for today**: Both global and agent capacity components should degrade gracefully ("No plan for today") instead of throwing.
- **Zero allocation**: If `total_allocated_minutes = 0`, treat `completion_ratio` as 0 and show `0%`.
- **Time zones**: We currently use server-side `new Date().toISOString().split("T")[0]` for `today`. This is acceptable for v1; if we see drift versus the UI timezone, we can later plumb a `date` param from the frontend.
- **Performance**: The queries are bounded by either explicit `LIMIT` or by the natural size of `daily_plans`. Expected cardinality is small (days, not rows), so this is safe.

---

## Summary of Work

**Backend**
- [ ] Extend `/api/analytics/capacity` to accept `from`, `to`, `limit` and compute `completion_ratio`.
- [ ] Add `GET /api/analytics/capacity/today` endpoint.

**Frontend**
- [ ] Add `useCapacityAnalytics` hook.
- [ ] Add `GlobalCapacityIndicator` component and surface it in the main shell.
- [ ] Add `AgentCapacityCard` component and display it in the agent detail card when opened.

This patch gives Opencode a clear, incremental path: first wire up the backend API, then land the lightweight UI changes without disturbing existing flows.