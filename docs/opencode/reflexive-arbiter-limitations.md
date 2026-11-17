# Reflexive Arbiter v2.0.0 — Remaining Architectural Limitations

**Status**: Documented Post-Validation  
**Date**: November 16, 2026  
**Context**: Measurement Validation completion — known constraints for future iterations

---

## Executive Summary

The Reflexive Arbiter v2.0.0 successfully implements Measurement Validation objectives and passes 24/25 regression tests. However, as a research instrument deployed in a simulation environment, it has architectural limitations that constrain its applicability to production governance assessment. This document catalogs these limitations for transparency and future planning.

---

## Category 1: Evidence Collection & Verification

### 1.1 No Live Source Verification
- **Limitation**: Source URIs are recorded but not fetched or validated at collection time
- **Impact**: Fabricated or stale URIs not detected automatically
- **Mitigation**: `verificationStatus: "unverified"` default; human review required
- **Future**: Implement async URI validation with caching

### 1.2 Knowledge Base Single Point of Failure
- **Limitation**: All KB queries route to single endpoint (`KB_SERVER_URL`); no local cache
- **Impact**: KB unavailable = fallback to LLM-only evidence collection
- **Observed**: Tests show "Connection refused" for all KB queries
- **Future**: Local document cache with TTL; graceful degradation modes

### 1.3 LLM Hallucination Not Prevented
- **Limitation**: LLM assertions marked as `llm_assertion` but not prevented from entering evidence pool
- **Impact**: Downstream stages must filter; risk of accidental inclusion
- **Current**: Validation function `validateEvidenceIntegrity()` detects but doesn't block
- **Future**: Collector-level rejection of `llm_assertion` for critical evidence types

### 1.4 No Evidence Freshness Enforcement
- **Limitation**: `publishedAt` recorded but not evaluated for recency
- **Impact**: Stale evidence (e.g., 2021 telecom audit) weighted equally with current
- **Future**: Configurable freshness thresholds per dimension; decay weighting

---

## Category 2: Scoring & Aggregation Methodology

### 2.1 Equal Dimension Weighting
- **Limitation**: All 6 dimensions contribute equally to overall score
- **Impact**: Competency crisis (rating 4) weighted same as Accountability (rating 2)
- **Domain Reality**: Some domains (e.g., nuclear, aviation) have critical dimensions
- **Future**: Configurable dimension weights per domain; criticality multipliers

### 2.2 Fixed Critical Threshold (≥3)
- **Limitation**: Critical = rating 3 or 4; not configurable
- **Impact**: Cannot adapt to domain-specific risk appetites
- **Future**: Per-dimension critical thresholds; policy-as-code configuration

### 2.3 No Uncertainty Propagation
- **Limitation**: Dimension confidence scores (0-1) reported but not mathematically combined
- **Impact**: Overall confidence = simple mean; doesn't reflect compounding uncertainty
- **Example**: Two dimensions at 0.5 confidence → overall 0.5, but joint uncertainty higher
- **Future**: Bayesian uncertainty propagation; confidence intervals on aggregate scores

### 2.4 Binary Critical Flag
- **Limitation**: `hasCriticalDivergence` is boolean; no severity gradation
- **Impact**: One dimension at 3 = same flag as five dimensions at 4
- **Future**: Criticality score = Σ(max(0, rating-2)) for graded severity

### 2.5 Unknown Rating Semantics
- **Limitation**: `unknown` excluded from mean but not from critical count
- **Edge Case**: All dimensions unknown → overall 0, critical 0, unknown 6
- **Interpretation Risk**: Could be misread as "no divergence" vs "no evidence"
- **Current**: Explicitly documented in `evidenceLimitations`
- **Future**: Separate "assessability" metric; require minimum coverage for valid assessment

---

## Category 3: Scrum Workflow & Orchestration

### 3.1 Fixed 7-Stage Pipeline
- **Limitation**: No dynamic stage skipping, conditional branching, or parallel execution
- **Impact**: All assessments take same path regardless of scope/complexity
- **Example**: Simple system with full evidence still runs cross-agent review
- **Future**: DAG-based workflow; evidence-driven stage gating

### 3.2 No Human-in-the-Loop Gates
- **Limitation**: Auto-run completes all stages without human review checkpoints
- **Impact**: Cannot pause for expert input on contradictory evidence
- **Current**: Manual `advance` endpoint exists but not integrated into auto-run
- **Future**: Configurable pause stages; notification/webhook on disagreement

### 3.3 Single Evidence Collector
- **Limitation**: One collector function per assessment; no ensemble or multi-source
- **Impact**: No cross-validation between KB, LLM, human, and automated sources
- **Future**: Collector registry with weighted ensemble; consensus evidence building

### 3.4 Agent Role Simplicity
- **Limitation**: 4 fixed roles (clerk, specialist, executive, archivist) with static task assignment
- **Impact**: No dynamic role allocation based on dimension expertise
- **Current**: Round-robin assignment modulo 4
- **Future**: Competency-based task routing; specialist pools per dimension

### 3.5 No Assessment Timeout/Recovery
- **Limitation**: Stuck stages (e.g., LLM timeout) require manual intervention
- **Impact**: Auto-run can hang indefinitely
- **Observed**: Tests complete fast with mocks; real LLM calls would need timeouts
- **Future**: Per-stage timeouts; automatic retry with backoff; dead letter queue

---

## Category 4: Longitudinal & Comparative Analysis

### 4.1 Pairwise Comparison Only
- **Limitation**: Compare endpoint only supports current vs. one previous
- **Impact**: No multi-assessment trend lines; cannot detect acceleration
- **Future**: Time-series analysis; statistical trend detection (Mann-Kendall, etc.)

### 4.2 Telemetry Trends Placeholder
- **Limitation**: `telemetryTrends` array in `LongitudinalComparison` not populated
- **Impact**: Cannot track MTTR improvement, backlog reduction over time
- **Current**: Structure exists but comparison logic only handles ratings
- **Future**: Full telemetry time-series with change-point detection

### 4.3 No Statistical Significance Testing
- **Limitation**: Rating changes treated as deterministic; no confidence intervals
- **Impact**: 3→2 change reported as "improved" regardless of evidence quality
- **Future**: Bootstrap confidence intervals on dimension ratings; p-values for trends

### 4.4 Methodology Version Drift
- **Limitation**: v1.0.0 assessments lack v2.0.0 refinement fields
- **Impact**: Cross-version comparison loses critical count, coverage, etc.
- **Current**: Graceful degradation (fields undefined)
- **Future**: Automated v1→v2 migration with evidence re-classification

---

## Category 5: Reliability, Operations & Deployment

### 5.1 File-Based Storage Only
- **Limitation**: JSON files in `data/reflexive_arbiter/`; no database
- **Impact**: No concurrent write protection; no query performance; no backup strategy
- **Risk**: Simultaneous assessments could corrupt files
- **Future**: SQLite/PostgreSQL backend; ACID transactions; connection pooling

### 5.2 No Authentication/Authorization
- **Limitation**: All API endpoints (`/api/arbiter/*`) publicly accessible
- **Impact**: Any caller can start assessments, read reports, delete data
- **Context**: Acceptable for lab environment; not for production
- **Future**: JWT/OAuth2; role-based access (assessor, reviewer, viewer)

### 5.3 Single-Node Deployment
- **Limitation**: No horizontal scaling; state in memory + local filesystem
- **Impact**: Cannot run multiple arbiter workers; no HA
- **Future**: Stateless workers + shared database; Redis for session state

### 5.4 No Observability Integration
- **Limitation**: Arbiter stages not instrumented with Prometheus metrics
- **Impact**: Cannot monitor assessment throughput, stage duration, failure rates
- **Context**: Pixel Office has Prometheus (`/metrics`) but arbiter not integrated
- **Future**: `pixel_office_arbiter_stage_duration_seconds`, `pixel_office_arbiter_assessments_total`

### 5.5 No Data Retention Policy
- **Limitation**: Assessments accumulate indefinitely in `data/` and `docs/reports/`
- **Impact**: Disk growth unbounded; no GDPR/retention compliance
- **Future**: Configurable TTL; archival to cold storage; purge API

---

## Category 6: Validation & Testing Gaps

### 6.1 One Integration Test Skipped
- **Test**: "should mark LLM-generated content appropriately"
- **Reason**: ESM mock infrastructure couldn't intercept `callChatModelForRole` in evidence collector
- **Impact**: LLM assertion marking not verified in CI
- **Workaround**: Manual verification of report output shows correct marking
- **Fix**: Dependency injection for LLM client; or vitest ESM mock improvements

### 6.2 No Property-Based Testing
- **Limitation**: Tests use fixed inputs; edge cases not exhaustively explored
- **Missing**: RapidCheck/fast-check style property tests for:
  - Evidence coverage calculation with various classification combinations
  - Scoring refinement with all rating/unknown permutations
  - Longitudinal comparison with missing dimensions

### 6.3 No Chaos Testing
- **Limitation**: Network partitions, disk failures, OOM, clock skew not tested
- **Risk**: File writes during crash could corrupt assessment JSON
- **Future**: Chaos Mesh / Litmus integration; fault injection in CI

### 6.4 No Load/Performance Testing
- **Limitation**: Concurrent assessment behavior not characterized
- **Unknown**: Max parallel assessments; memory/CPU under load
- **Future**: k6/Gatling scripts; SLO definition (e.g., "95% complete <5 min")

---

## Category 7: Domain & Regulatory Adaptability

### 7.1 No Domain-Specific Templates
- **Limitation**: Same 6 dimensions, same evidence requirements for all systems
- **Impact**: Aviation (FAA) needs different evidence than Cybersecurity (Google)
- **Current**: Boundaries and scope text customize but structure fixed
- **Future**: Domain packs (aviation, finance, healthcare, AI) with tailored dimensions/evidence

### 7.2 No Regulatory Mapping
- **Limitation**: Findings not mapped to regulatory frameworks (NIST, ISO, SOC2, Part 21, etc.)
- **Impact**: Cannot generate compliance-ready evidence packages
- **Future**: Regulatory control mapping; evidence-to-control traceability matrix

### 7.3 No Multi-Language/Internationalization
- **Limitation**: All reports, evidence, UI in English only
- **Impact**: Cannot assess systems governed by non-English regulators
- **Future**: i18n framework; multi-language evidence support

---

## Prioritization Matrix

| Limitation | Severity | Effort | Priority |
|---|---|---|---|
| Database backend | High | Medium | **P0** — Foundation for all else |
| Authentication/Authorization | High | Low | **P0** — Security baseline |
| LLM mock test fix | Medium | Low | **P1** — CI completeness |
| KB caching layer | Medium | Medium | **P1** — Reliability |
| Domain-specific templates | Medium | High | **P2** — Adoption |
| Uncertainty propagation | Medium | High | **P2** — Scientific rigor |
| Human review gates | Low | Medium | **P3** — Workflow maturity |
| Telemetry trend analysis | Low | Medium | **P3** — Longitudinal value |
| Chaos testing | Low | High | **P4** — Production hardening |
| Multi-language support | Low | High | **P5** — International |

---

## Conclusion

The Reflexive Arbiter v2.0.0 is **validated as a research instrument** for comparative governance divergence assessment within its documented constraints. It successfully:

- Produces evidence-backed assessments with full provenance
- Surfaces critical failures that aggregate scores would obscure
- Distinguishes documented facts from hypotheses and LLM assertions
- Enables longitudinal tracking with versioned methodology

**It is not yet suitable for:**
- Production regulatory compliance without human expert review
- High-assurance domains requiring formal verification
- Multi-tenant or internet-exposed deployment
- Automated decision-making without human-in-the-loop

**Recommended Path**: Address P0/P1 limitations (database, auth, KB cache, test fix) before expanding scope. Domain templates and regulatory mapping can proceed in parallel for target use cases.

---

*This limitations document is part of the Measurement Validation deliverables and should be updated with each methodology version.*