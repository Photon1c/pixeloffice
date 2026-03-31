# Opencode Handoff: SherlockTrader ↔ Pixel Office Integration

## Goal

Design and begin implementing a shared abstraction layer so that:

- **SherlockTrader** (strategy + narrative layer) and **Pixel Office** (mock/synthetic engine) can both:
  - Use a common interface for asset analysis.
  - Swap or combine data sources (real vs mock) without changing the user-facing logic.
- The user interacts with SherlockTrader using a consistent vocabulary (symbols, horizons, scenarios), regardless of whether the underlying data is real market data or synthetic/mock.

This document defines the target interfaces and responsibilities.

## High-Level Architecture

### Components

1. **Analyzer interface (core abstraction)**
   - A trait/interface representing "something that can analyze an asset given a context".

2. **Implementations**
   - `RealAnalyzer` (e.g. backed by Yahoo / stock-analysis skill / actual market APIs).
   - `MockAnalyzer` (Pixel Office mock/sim engine).
   - `HybridAnalyzer` (combines outputs from both).

3. **SherlockTrader**
   - Consumes the `Analyzer` trait.
   - Provides user-facing narratives, comparisons, and strategy simulations.

4. **Pixel Office**
   - Provides the `MockAnalyzer` implementation.
   - Optionally offers its own UI, but from Sherlock's perspective it's just an analyzer.

## Proposed Interface (Rust-flavored, can be adapted to TS/JS if needed)

```rust
enum DataSource {
    Real,
    Mock,
    Hybrid,
}

struct AnalysisContext {
    horizon: String,  // e.g. "1d", "1w", "1m", "1y"
    scenario: String, // e.g. "base", "bull", "bear", "stress"
    source: DataSource,
}

struct PriceSnapshot {
    symbol: String,
    current: f64,
    change_pct: f32,
    volume: Option<f64>,
}

struct Fundamentals {
    pe: Option<f32>,
    eps: Option<f32>,
    // extend as needed
}

struct TechnicalSummary {
    trend: String,      // "up", "down", "sideways"
    support_levels: Vec<f64>,
    resistance_levels: Vec<f64>,
}

struct RiskProfile {
    volatility: Option<f32>,
    max_drawdown: Option<f32>,
    notes: String,
}

struct ScenarioPrediction {
    scenario: String,   // e.g. "bull", "bear", "stress"
    horizon: String,    // e.g. "1m", "3m"
    price_target: f64,
    confidence: f32,    // 0.0 - 1.0
    rationale: String,
}

struct AssetAnalysis {
    symbol: String,
    price_snapshot: Option<PriceSnapshot>,
    fundamentals: Option<Fundamentals>,
    technical: Option<TechnicalSummary>,
    risk_profile: Option<RiskProfile>,
    scenarios: Vec<ScenarioPrediction>,
}

trait Analyzer {
    fn analyze_asset(&self, symbol: &str, ctx: &AnalysisContext) -> anyhow::Result<AssetAnalysis>;
}
```

This is a starting point; fields can be adjusted by opencode during implementation as needed.

## Responsibilities

### SherlockTrader

- **Input:**
  - User asks things like:
    - "Analyze AAPL for the next month."
    - "Compare TSLA and NVDA under a bear scenario."
- **Behavior:**
  - Translate user requests into `AnalysisContext` (horizon + scenario + source).
  - Call one or more `Analyzer` implementations.
  - Merge/compare `AssetAnalysis` results.
  - Generate narrative output (plain language summaries, strategy suggestions).

### Pixel Office (Mock Engine)

- Exposes a `MockAnalyzer` that implements `Analyzer`:
  - Uses mock data / simulations / synthetic price paths.
  - Focus on:
    - Scenario generation (`ScenarioPrediction` list).
    - Stress testing (e.g., extreme drawdowns, volatility spikes).
  - It can ignore real fundamentals or technicals if not available.

### Real Analyzer

- Exposes a `RealAnalyzer` that implements `Analyzer`:
  - Uses live or cached real market data.
  - Fills in `price_snapshot`, `fundamentals`, `technical`, `risk_profile`.
  - May or may not provide `scenarios` directly (those can be synthesized in a Hybrid layer).

### Hybrid Analyzer

- Combines both:
  - Calls `RealAnalyzer` for actual market state.
  - Calls `MockAnalyzer` for scenarios.
  - Returns a single `AssetAnalysis` where:
    - `price_snapshot` / `fundamentals` / `technical` / `risk_profile` come from Real.
    - `scenarios` come from Mock.

## Tasks for Opencode (with Pixel Office admin cockpit focus)

1. **Create a new module or crate** (depending on repo layout), e.g. `sherlock_analysis`:
   - Define the data structures and `Analyzer` trait as above (or an adapted variant).

2. **Identify existing Pixel Office mock engine**
   - Locate the module(s) or script(s) that implement mock stock prediction.
   - Document current input/output (symbol in, predictions out).

3. **Implement `MockAnalyzer`**
   - Wrap the existing Pixel Office logic in an `Analyzer` implementation.
   - Map existing outputs into `AssetAnalysis.scenarios` and any other fields we can sensibly fill.

4. **(Optional in first pass) Implement a basic `RealAnalyzer` stub**
   - If a full real-data integration is not ready yet, create a stub that:
     - Fills `symbol` and some placeholder `price_snapshot`.
     - Leaves `fundamentals`/`technical`/`risk_profile` as `None`.

5. **Integrate into SherlockTrader and Pixel Office admin cockpit**
   - Identify where SherlockTrader currently does stock/crypto analysis.
   - Replace or wrap that logic so Sherlock calls `Analyzer` instead of talking directly to the mock engine.
   - In Pixel Office, focus on the **admin cockpit**:
     - Wire the "Evaluate due stock forecasts" button so that it:
       - Gathers the relevant symbols / pending forecasts from Pixel Office storage.
       - For each symbol, constructs an `AnalysisContext` (e.g. horizon + scenario + source=Mock or Hybrid).
       - Calls the appropriate `Analyzer` implementation.
       - Updates the existing admin cockpit chart / table with the new `AssetAnalysis` results (e.g. refreshed price targets, scenario confidences).
     - Keep Pixel Office's core engine as-is; only adapt the admin UI/handler layer to use the shared `Analyzer` abstraction.
   - Provide a way to choose `DataSource` (Real / Mock / Hybrid) based on user input or config (e.g. a toggle in the admin cockpit for "Use real data", "Use mock", "Combine").

6. **Add a small end-to-end test/demo**
   - Example: a CLI or small function that:

```text
Input:  symbol = "AAPL", horizon = "1m", scenario = "base", source = Mock
Output: pretty-printed AssetAnalysis JSON
```

   - This will be used to confirm that the Pixel Office mock engine is correctly wired into the abstraction.

## Notes

- The exact module names, crate boundaries, and field sets are flexible; the key is to keep the `Analyzer` interface simple and stable.
- SherlockTrader should never need to know whether an analysis came from real or mock data; it just receives `AssetAnalysis`.
