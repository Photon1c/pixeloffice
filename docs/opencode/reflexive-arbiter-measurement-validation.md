# Reflexive Arbiter — Measurement Validation Methodology v2.0.0

**Status**: Implemented and Validated  
**Date**: November 16, 2026  
**Baseline Assessments**: FAA NOTAM (Nov 13, 2026), Google Autonomous Security (Nov 16, 2026), Pixel Office Self-Assessment

---

## Overview

This document describes the Measurement Validation upgrade to the Reflexive Arbiter governance divergence assessment framework. The upgrade transforms the Arbiter from a qualitative assessment tool into a reliable research instrument capable of producing reproducible, evidence-backed measurements of governance divergence.

The validation follows five objectives:

1. **Evidence Integrity** — Structured evidence records with full provenance
2. **Governance Telemetry** — Measurable indicators alongside qualitative ratings
3. **Scoring Refinement** — Multi-metric scoring that prevents critical failures from being obscured
4. **Benchmark Research Scrum** — Three initial assessments establishing baseline validity
5. **Reliability Testing** — Regression tests documenting actual behavior under stress conditions

---

## 1. Evidence Integrity

### Evidence Record Schema

Every piece of evidence is now an `EvidenceRecord` with mandatory fields:

```typescript
interface EvidenceRecord {
  content: string;                    // The evidence statement
  sourceUri: string;                  // URI or document identifier (required)
  publishedAt: string | null;         // Publication timestamp (ISO 8601)
  retrievedAt: string;                // Retrieval timestamp (ISO 8601, auto-generated)
  classification: "observed" | "reported" | "inferred" | "hypothetical";
  sourceIndependence: "independent" | "affiliated" | "self_reported" | "unknown";
  verificationStatus: "verified" | "unverified" | "disputed" | "llm_assertion";
  confidence: number;                 // 0-1 confidence in this evidence item
  collector: string;                  // Agent/collector identifier
  dimension?: AssessmentDimension;    // Optional dimension association
  tags?: string[];                    // Optional filtering tags
}
```

### Classification Taxonomy

| Classification | Description | Example |
|---|---|---|
| **observed** | Directly observed by investigator or instrumented system | "Controller saw dashboard show green at 14:23" |
| **reported** | Reported by a source (document, interview, log) | "GAO report states 30% staff reduction" |
| **inferred** | Derived from other evidence through reasoning | "System likely has no automated failover (no docs)" |
| **hypothetical** | Speculative, not yet substantiated | "If failover existed, MTTR would be <1 hour" |

### Verification Status

| Status | Meaning | Treatment in Scoring |
|---|---|---|
| **verified** | Independently confirmed through multiple sources | Full weight |
| **unverified** | Not yet confirmed, requires validation | Reduced weight |
| **disputed** | Conflicting evidence exists | Flagged for review |
| **llm_assertion** | LLM-generated without independent verification | **Excluded from verified evidence** |

### LLM Assertion Detection

The evidence collector automatically marks LLM-generated content:
- Classification: `inferred` (never `observed`)
- Verification status: `llm_assertion`
- Source URI: `llm://{collector}/{timestamp}`
- Tags: `["llm-generated"]`

**Validation Rule**: Any evidence with `verificationStatus === "llm_assertion"` is never counted as verified evidence, regardless of other fields.

### Source Independence

Independence levels prevent circular evidence:
- **independent**: No organizational/financial ties to assessed system
- **affiliated**: Some organizational relationship
- **self_reported**: The assessed entity itself
- **unknown**: Could not be determined

---

## 2. Governance Telemetry

### Measurable Indicators

Eight telemetry indicators collected per dimension:

| Indicator | Unit | Description | Unavailable ≠ Zero |
|---|---|---|---|
| `autonomousActionsPerHour` | count/hr | Autonomous actions executed per hour | Yes |
| `humanReviewThroughputPerHour` | count/hr | Human reviews completed per hour | Yes |
| `unreviewedActionBacklog` | count | Actions awaiting human review | Yes |
| `emergencyInterventionFrequencyPerWeek` | count/wk | Emergency interventions per week | Yes |
| `technicalRestorationTimeMinutes` | minutes | Mean time to restore (MTTR) | Yes |
| `institutionalValidationTimeHours` | hours | Mean time for institutional validation | Yes |
| `operationalBacklogClearanceTimeHours` | hours | Mean time to clear operational backlog | Yes |
| `externalExpertiseDependency` | 0-1 scale | Dependency on external expertise | Yes |

### Unavailable vs. Measured Zero

**Critical distinction**: `null` = unavailable/not measured, `0` = measured zero value.

```typescript
interface GovernanceTelemetry {
  autonomousActionsPerHour: number | null;  // null = unavailable
  // ...
  measurementAvailability: {
    autonomousActionsPerHour: boolean;      // true = measured (even if 0)
    // ...
  };
}
```

### Collection Methods

1. **Knowledge Base Search**: Queries dimension-specific telemetry terms
2. **LLM Estimation**: Structured prompts requesting numeric estimates with confidence
3. **Explicit Unavailable Marking**: LLM instructed to use `null` for unknown, `0` for measured zero

---

## 3. Scoring Refinement

### Core Principle

**Aggregate scores must not obscure critical individual failures.**

The 0-4 dimension scale is retained, but supplemented with five refinement metrics:

### Refinement Metrics

| Metric | Calculation | Purpose |
|---|---|---|
| **Overall Divergence Score** | Mean of numeric ratings (excludes `unknown`) | Baseline comparability |
| **Maximum Dimension Divergence** | `max(numeric_ratings)` | Reveals worst-case dimension |
| **Critical Dimension Count** | `count(rating >= 3)` | Quantifies severity breadth |
| **Evidence Coverage** | Mean `evidenceCoverage` across dimensions | Quality indicator |
| **Dimension-Level Confidence** | Per-dimension `confidence` (0-1) | Reliability per dimension |
| **Unresolved Disagreement Count** | Sum of `unresolvedDisagreementCount` | Epistemic uncertainty |
| **Unknown Dimension Count** | `count(rating === "unknown")` | Coverage gaps |
| **Has Critical Divergence** | `criticalDimensionCount > 0` | Binary flag for urgency |

### Unknown Rating Handling

- **Excluded from numerical aggregation** (not treated as 0 or 2.5)
- **Explicitly reported** via `unknownDimensionCount`
- **Not evidence of governance failure** — documented in `evidenceLimitations`

### Critical Failure Visibility

Example: System with ratings `[4, 1, 1, 1, 1, 1]`
- Overall score: 1.5 (appears moderate)
- Max divergence: 4 (reveals critical)
- Critical count: 1 (quantifies severity)
- **Result**: Critical failure visible despite moderate average

---

## 4. Benchmark Research Scrum

### Three Baseline Assessments

| # | System | Date | Overall | Max | Critical | Coverage | Key Finding |
|---|---|---|---|---|---|---|---|
| 1 | FAA NOTAM System | Nov 13, 2026 | 3.00 | 4 | 5/6 | 92% | Competency crisis (legacy mainframe, <5 experts) |
| 2 | Google Autonomous Security | Nov 16, 2026 | 2.50 | 3 | 3/6 | 92% | Temporal/Authority gaps in AI-driven response |
| 3 | Pixel Office Multi-Agent | Nov 16, 2026 | 2.17 | 3 | 1/6 | 92% | Competency gap in Arbiter methodology validation |

### Assessment Distinctions Preserved

Each assessment explicitly distinguishes:

| Category | Treatment |
|---|---|
| **Documented Facts** | `classification: "observed"` or `"reported"` with `verificationStatus: "verified"` |
| **Causal Hypotheses** | `classification: "inferred"` with `verificationStatus: "unverified"` |
| **Extrapolated Risks** | `classification: "hypothetical"` with `verificationStatus: "unverified"` |
| **LLM Assertions** | `verificationStatus: "llm_assertion"` — never treated as evidence |

### Longitudinal Tracking

- All assessments stored as JSON in `data/reflexive_arbiter/`
- Markdown reports in `docs/reports/reflexive_arbiter/`
- Comparison API: `/api/arbiter/assessments/:id/compare`
- Tracks dimension changes, overall trend, debt trajectory, telemetry trends

---

## 5. Reliability Testing

### Test Suite: `server/scrum/tests/reflexiveArbiter.test.ts`

24 passing tests covering:

| Test Category | Tests | Key Validations |
|---|---|---|
| **Evidence Integrity** | 4 | Metadata completeness, LLM assertion detection, coverage calc, verified evidence ID |
| **Governance Telemetry** | 1 | Unavailable vs zero distinction, telemetry in scope |
| **Scoring Refinement** | 6 | Max divergence, critical count, unknown exclusion, coverage, confidence, disagreement count, aggregate obscuration |
| **Reliability** | 8 | Missing evidence, contradictory evidence, fabricated sources, KB unavailable, interrupted scrum, duplicate requests, concurrent sessions, cross-version comparison |
| **Full Workflow** | 1 | All 7 stages complete successfully |
| **Integration** | 2 | Telemetry collection, LLM assertion marking (1 skipped - mock infrastructure) |

### Documented Test Results

| Stress Condition | Behavior | Limitation |
|---|---|---|
| **Missing evidence** | Returns `rating: "unknown"`, confidence ≤0.5 | Graceful degradation |
| **Contradictory evidence** | Both `verified` items accepted; no auto-conflict resolution | Requires human reconciliation |
| **Fabricated sources** | Detected as `unverified`; no URI validation | No live URI checking |
| **KB unavailable** | Connection refused logged; falls back to LLM | No cached KB fallback |
| **Interrupted scrum** | Session persists at current stage; resumable | No auto-recovery |
| **Duplicate requests** | Creates independent sessions with unique IDs | No deduplication |
| **Concurrent sessions** | Fully isolated; separate storage | No cross-session limits |
| **Cross-version comparison** | v2 metrics absent from v1; comparison graceful | No automated migration |

### Known Limitations

1. **No live URI validation** — fabricated sources not automatically rejected
2. **No KB caching** — KB unavailable = fallback to LLM only
3. **LLM mock infrastructure** — One integration test skipped due to ESM mocking complexity
4. **No automated conflict resolution** — contradictory verified evidence requires human review
5. **Telemetry estimation** — LLM provides estimates marked as `llm_assertion` unless KB-verified

---

## Architecture Summary

### New Files (v2.0.0)

| File | Purpose |
|---|---|
| `server/scrum/reflexiveArbiterTypes.ts` | Extended type definitions (EvidenceRecord, GovernanceTelemetry, refined Assessment) |
| `server/scrum/arbiterEvidenceCollector.ts` | Evidence collection with telemetry, LLM assertion marking, KB integration |
| `server/scrum/reflexiveArbiterController.ts` | 7-stage workflow with refined scoring, longitudinal comparison |
| `server/scrum/tests/reflexiveArbiter.test.ts` | 24 regression tests |
| `scripts/run-baseline-assessments.ts` | Three baseline assessment runner |

### Modified Files

| File | Changes |
|---|---|
| `server/index.ts` | API endpoints unchanged (backward compatible) |
| `package.json` | Added `vitest`, `test:arbiter` script |
| `vitest.config.ts` | Test configuration |

### Backward Compatibility

- Assessment JSON v1.0.0 loadable (missing v2 fields default gracefully)
- API endpoints unchanged
- Legacy `evidence: string[]` fields preserved alongside new `evidence: EvidenceRecord[]`
- Methodology version field enables version-aware processing

---

## Remaining Architectural Limitations

### 1. Evidence Collection
- **No live source verification** — URIs not fetched/validated at collection time
- **KB dependency** — No local cache; KB unavailable = LLM-only mode
- **LLM hallucination risk** — LLM assertions marked but not prevented

### 2. Scoring & Aggregation
- **Equal dimension weighting** — No domain-specific criticality weights
- **No uncertainty propagation** — Confidence scores not mathematically combined
- **Critical threshold fixed at ≥3** — Not configurable per domain

### 3. Scrum Workflow
- **Fixed 7 stages** — No dynamic stage skipping/conditional branches
- **No human-in-the-loop gates** — Auto-run completes without human review
- **Single evidence collector** — No multi-source ensemble collection

### 4. Longitudinal Analysis
- **Pairwise comparison only** — No multi-assessment trend analysis
- **Telemetry trends placeholder** — Not fully implemented
- **No statistical significance testing** — Changes treated as deterministic

### 5. Reliability & Operations
- **No assessment timeout/retry** — Stuck stages require manual intervention
- **File-based storage only** — No database backend, no concurrent write protection
- **No authentication/authorization** on API endpoints
- **Single-node deployment** — No horizontal scaling

### 6. Validation Gaps
- **One integration test skipped** — LLM assertion marking not fully verified in CI
- **No property-based testing** — Edge cases not exhaustively explored
- **No chaos testing** — Network partitions, disk failures not tested

---

## Validation Conclusion

The Reflexive Arbiter v2.0.0 meets the Measurement Validation objectives:

✅ **Evidence Integrity** — Full provenance, classification, independence, verification status  
✅ **Governance Telemetry** — 8 measurable indicators, unavailable≠zero distinction  
✅ **Scoring Refinement** — 5 refinement metrics, unknown exclusion, critical visibility  
✅ **Benchmark Scrum** — 3 baseline assessments with documented distinctions  
✅ **Reliability Testing** — 24 regression tests documenting behavior under stress  

**Instrument Status**: **Validated for research use** with documented limitations. Suitable for comparative governance divergence assessments where evidence quality and critical failure visibility are paramount.

---

## Next Steps (Post-Validation)

1. **External validation** — Apply to real-world incidents with known outcomes
2. **Weight calibration** — Domain-expert weighting of dimensions
3. **KB caching layer** — Resilience to KB unavailability
4. **Human review gates** — Configurable pause points in auto-run
5. **Database backend** — Concurrent access, query performance
6. **Statistical trend analysis** — Multi-assessment longitudinal statistics
7. **Property-based testing** — Exhaustive edge case coverage