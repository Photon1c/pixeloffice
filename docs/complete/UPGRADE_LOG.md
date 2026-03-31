# Pixel Office Upgrade Log

## 2026-02-21

- **Daily Plans System**
  - New database tables: `tasks`, `daily_plans`, `daily_plan_items` (schema v4)
  - API endpoints:
    - `POST /api/daily_plan` - Generate AI-powered daily plan
    - `GET /api/daily_plan` - Get today's plan
    - `POST /api/tasks` - Create task
    - `GET /api/tasks` - List tasks
    - `PATCH /api/tasks/:id` - Update task
    - `DELETE /api/tasks/:id` - Delete task

- **Sherlock Analysis Module**
  - New `sherlock_analysis` module with three analyzer types:
    - `MockAnalyzer` - Synthetic predictions for testing
    - `RealAnalyzer` - Real market data from Yahoo Finance
    - `HybridAnalyzer` - Real prices with mock scenarios
  - API endpoints:
    - `POST /api/analyze` - Analyze asset
    - `GET /api/analyze/sources` - List available data sources

- **Stock Forecasts UI Enhancements**
  - Added "Task Manager" and "Daily Plan" tabs
  - Delete button for forecasts
  - Improved form validation

- **Bug Fixes**
  - Fixed foreign key constraint error when creating forecasts (missing default user)
  - Added default user (id=1) creation in migrations

- **Files Modified**
  - `src/pixel_memory/schema.ts` - Added v4 schema
  - `src/pixel_memory/migrations.ts` - Added default user creation
  - `server/index.ts` - Added daily plan, analyze, and delete endpoints
  - `server/sherlock_analysis/index.ts` - New analyzer module
  - `src/components/StockForecasts.tsx` - Added tabs and delete functionality
  - `scripts/ensure-user.ts` - Utility script for creating default user

## 2026-02-22 (Spec Only)

- **Capacity Analytics & Agent Capacity Cards Spec**
  - Added `dev_logs/NEXT_CAPACITY_UPGRADE_SPEC.md` describing the next upgrade for capacity discipline:
    - Extend `GET /api/analytics/capacity` with optional `from`, `to`, and `limit` query params and computed `completion_ratio`.
    - Add `GET /api/analytics/capacity/today` endpoint for a focused, today-only capacity payload.
  - Frontend design notes:
    - New `useCapacityAnalytics` hook for fetching today + recent history.
    - `GlobalCapacityIndicator` component for top-level dashboard status.
    - `AgentCapacityCard` component to show capacity info inside an agent's detail card.
  - No migrations required; this spec builds on the existing `daily_plans` / `daily_plan_items` / `tasks` schema and the already-added `completed_at` field on `daily_plan_items`.