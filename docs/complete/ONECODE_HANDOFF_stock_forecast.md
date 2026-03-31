# Opencode Handoff: Stock Forecast Tracking Workflow

## Overview
This document describes a concrete workflow for Pixel Office to track stock tickers, user predictions, and forecast accuracy over time. It is intended as a handoff spec for Opencode (or any coding agent) to implement and extend.

Primary use case:
- Users create short- to medium-term forecasts (e.g. 2-week performance) for specific stock tickers.
- Pixel Office stores forecasts, evaluates them when the target date is reached, and computes error metrics.
- Users can review their forecasting history and accuracy.

---

## Core Entities & Data Model

### 1. User
Represents an authenticated person using Pixel Office.

**Table: `users`** (existing or to be integrated)
- `id` (PK, bigint/uuid)
- `email` (unique)
- `name` (nullable)
- `created_at` (datetime)
- `updated_at` (datetime)

> Opencode: If a `users` table already exists, adapt this spec to the existing schema instead of duplicating.

### 2. Stock Ticker
Represents a unique traded instrument.

**Table: `stock_tickers`**
- `id` (PK, bigint)
- `symbol` (varchar(16), unique, e.g. 'AAPL', 'MSFT')
- `exchange` (varchar(32), nullable, e.g. 'NASDAQ')
- `name` (varchar(255), nullable)
- `created_at` (datetime, default NOW)

**Indexes:**
- `UNIQUE(symbol)`
- Optional: index on `(exchange, symbol)` if multi-exchange support is needed.

### 3. Stock Forecast
A prediction made by a user for a future price or return.

**Table: `stock_forecasts`**
- `id` (PK, bigint)
- `user_id` (FK -> users.id)
- `ticker_id` (FK -> stock_tickers.id)
- `created_at` (datetime) – when the forecast was made
- `horizon_days` (int) – intended forecast horizon (e.g. 14 for 2 weeks)
- `target_date` (date/datetime) – explicit date the forecast is about
- `prediction_type` (enum / varchar(32)) – e.g. 'price', 'percentage_return', 'direction'
- `predicted_price` (decimal(18,4), nullable)
- `predicted_return_pct` (decimal(9,4), nullable) – expected % change from `current_price` at creation time
- `predicted_direction` (enum / varchar(16), nullable) – e.g. 'up', 'down', 'flat'
- `notes` (text, nullable) – freeform rationale

- `status` (enum/varchar(32)) – 'pending', 'evaluated', 'invalid'
- `evaluated_at` (datetime, nullable)
- `actual_price` (decimal(18,4), nullable)
- `actual_return_pct` (decimal(9,4), nullable)
- `absolute_error_price` (decimal(18,4), nullable)
- `absolute_error_pct` (decimal(9,4), nullable)

**Indexes:**
- `INDEX(user_id, created_at)` – for per-user history views
- `INDEX(ticker_id, target_date)` – for bulk evaluation jobs and per-ticker analytics
- `INDEX(status, target_date)` – for scheduled evaluation scans (e.g. find all pending forecasts whose target_date <= NOW)

### 4. Optional: Price History (External vs Internal)

Assumption: Actual prices may come from an external API rather than a full internal price history table.

**Opencode guidance:**
- Start with an external data provider call at evaluation time.
- Optionally, create a simple `stock_prices` table later if caching or backtesting is required.

**Potential `stock_prices` table (future):**
- `id` (PK)
- `ticker_id` (FK)
- `date` (date)
- `close_price` (decimal(18,4))

---

## Workflow: Creating a Forecast

1. **User selects or creates a ticker**
   - UI: search/select input for `symbol` (e.g. 'AAPL').
   - Backend:
     - If `stock_tickers.symbol` exists, reuse it.
     - Else, create new row with minimal data.

2. **User enters forecast details**
   - Inputs:
     - Ticker symbol
     - Forecast horizon (default: 14 days)
     - Target date (auto = now + horizon, editable)
     - Prediction type (start with 'price' and 'direction')
     - Predicted price and/or direction
     - Optional rationale notes

3. **System captures baseline data**
   - Fetch current market price (if API integration exists).
   - Save `created_at` and optionally the baseline `current_price` in the forecast record or a separate field.

4. **Persist forecast**
   - Insert into `stock_forecasts` with `status = 'pending'`.

5. **UI feedback**
   - Show a confirmation with:
     - Summary of the prediction
     - Target evaluation date
     - Link to "My Forecasts" page.

---

## Workflow: Evaluating a Forecast

Trigger: system job (cron-like) or manual admin action scans for forecasts where:
- `status = 'pending'` AND `target_date <= NOW()`.

Steps:
1. For each matching forecast:
   - Fetch actual price for ticker at or near `target_date` (exact close, or nearest trading day).
   - Compute returns and errors:
     - `actual_return_pct` = (actual_price - baseline_price) / baseline_price * 100
     - `absolute_error_price` = |predicted_price - actual_price|
     - `absolute_error_pct` = |predicted_return_pct - actual_return_pct|
   - Determine direction correctness if applicable (up/down/flat vs actual move).

2. Update `stock_forecasts` row:
   - Set `status = 'evaluated'`
   - Set `evaluated_at = NOW()`
   - Store `actual_price`, `actual_return_pct`, and error columns.

3. Optionally, emit an event/log entry:
   - `activity_log` or similar table for auditing and UX notifications.

---

## UI Surfaces

### 1. Forecast Creation Form

Location suggestion: `/stocks/forecasts/new`

Fields:
- Ticker (searchable select)
- Horizon (days, default 14)
- Target date (auto-derived, editable)
- Prediction type (radio: Price / Direction)
- Predicted price (if Type = Price)
- Direction (Up / Down / Flat; if Type = Direction)
- Notes (textarea)

Behavior:
- Basic client-side validation (required fields, numeric constraints).
- Show expected evaluation date and a quick explanation of how accuracy will be measured.

### 2. "My Forecasts" Dashboard

Location: `/stocks/forecasts`

Sections:
- **Active Forecasts** (status = pending)
  - Columns: Ticker, Made On, Target Date, Horizon, Prediction Summary, Status.
- **Past Forecasts** (status = evaluated)
  - Columns: Ticker, Made On, Target Date, Predicted vs Actual, Error, Direction Correct?, Notes.

Filters:
- By ticker
- By date range
- By status (pending/evaluated)

### 3. Accuracy Overview (Per User)

- Aggregate metrics:
  - Number of forecasts
  - Mean absolute error (price)
  - Mean absolute error (%)
  - Direction hit-rate (% correct direction)
- Optional charts (future scope):
  - Error over time
  - Accuracy per ticker.

---

## API Endpoints (Initial Spec)

Assuming a REST-ish API under `/api/stocks`.

1. `POST /api/stocks/forecasts`
   - Auth required.
   - Body:
     - `symbol` (string)
     - `horizon_days` (int, optional, default 14)
     - `target_date` (ISO date, optional – derive if missing)
     - `prediction_type` ('price' | 'direction')
     - `predicted_price` (number, optional)
     - `predicted_direction` ('up' | 'down' | 'flat', optional)
     - `notes` (string, optional)
   - Behavior:
     - Resolve or create `stock_tickers` entry.
     - Create `stock_forecasts` linked to authenticated `user_id`.
   - Response:
     - Saved forecast object (id, timestamps, normalized fields).

2. `GET /api/stocks/forecasts`
   - Auth required.
   - Query params:
     - `status` (optional)
     - `symbol` (optional)
     - `from` / `to` (date range, optional)
   - Returns paginated forecasts for current user.

3. `GET /api/stocks/forecasts/:id`
   - Auth required; must belong to user (or admin).
   - Returns full forecast with evaluation details.

4. `POST /api/stocks/forecasts/evaluate-due` (admin or internal-only)
   - No body.
   - Behavior:
     - Finds all pending forecasts with `target_date <= NOW()`.
     - Evaluates them (calls external price API, computes errors).
   - Response:
     - Summary: `{ evaluatedCount, errors }`.

> Opencode: Secure this endpoint (e.g., admin-only or internal secret) and/or wire it to a scheduled job.

---

## External Integrations & Assumptions

- **Price Source:** Initially, use a simple HTTP client to query a single provider (e.g. Yahoo Finance API, Alpha Vantage, or another free tier service).
- **Timezones:** Use UTC at the DB level for all timestamps. UI can localize for users.
- **Trading Days:** If `target_date` is not a trading day, use closest prior trading day for evaluation (implementation detail can be refined later).

---

## Non-Functional Requirements

- **Security:**
  - Forecast data should always be scoped to the authenticated user by default.
  - Admin-only bulk views and evaluation endpoints.

- **Performance:**
  - Indexes on `(user_id, created_at)` and `(status, target_date)` should be sufficient for an MVP.
  - If volume grows large, add pagination and/or caching for summary stats.

- **Extensibility:**
  - Design tables so we can later add:
    - Confidence scores
    - Multiple horizon forecasts for same ticker
    - Sectors/industries and per-sector accuracy
    - Multi-asset forecasts.

---

## Handoff Notes for Opencode

1. Implement DB migrations for the three main tables:
   - `stock_tickers`
   - `stock_forecasts`
   - Any necessary `users` integration adjustments (if not already present).

2. Wire up the REST API endpoints under `/api/stocks/...` as described.

3. Implement a minimal UI flow:
   - Forecast creation form.
   - "My Forecasts" list with basic filtering.
   - Read-only detail view for an evaluated forecast.

4. Stub external price API integration behind a single service module, e.g. `server/services/priceFeed.ts`, so the provider can be swapped easily later.

5. Add a small internal-only endpoint or script to trigger evaluation for due forecasts.

6. Ensure TypeScript types are defined for:
   - `StockTicker`
   - `StockForecast`
   - API request/response payloads.

7. Add basic tests (or at least manual test notes) for:
   - Creating forecasts
   - Listing forecasts
   - Evaluating pending forecasts and computing error metrics.
