/**
 * Reflexive Arbiter — Governance Divergence Assessment Types
 * 
 * Extends Pixel Office's SCRUM infrastructure to support structured assessments
 * of institutional governance capacity relative to autonomous system capabilities.
 * 
 * Measurement Validation Upgrade (v2.0.0):
 * - Evidence Integrity: Source URI, timestamps, classification, independence, verification
 * - Governance Telemetry: Measurable indicators alongside qualitative ratings
 * - Scoring Refinement: Max divergence, critical count, evidence coverage, dimension confidence
 * - Benchmark Scrum: FAA outage, Google cyberattack, Pixel Office architecture
 * - Reliability Testing: Missing/contradictory evidence, fabricated refs, KB unavailable, etc.
 */

export type DivergenceRating = 0 | 1 | 2 | 3 | 4 | "unknown";

export type AssessmentDimension = 
  | "temporal" 
  | "authority" 
  | "visibility" 
  | "competency" 
  | "recovery" 
  | "accountability";

/** Evidence classification per measurement validation requirements */
export type EvidenceClassification = "observed" | "reported" | "inferred" | "hypothetical";

/** Verification status for evidence */
export type VerificationStatus = "verified" | "unverified" | "disputed" | "llm_assertion";

/** Source independence level */
export type SourceIndependence = "independent" | "affiliated" | "self_reported" | "unknown";

/**
 * Extended evidence record with full integrity metadata
 * Implements Evidence Integrity requirements (Objective 1)
 */
export interface EvidenceRecord {
  /** The evidence content/statement */
  content: string;
  /** Source URI or document identifier */
  sourceUri: string;
  /** Publication timestamp (when source was published) */
  publishedAt: string | null;
  /** Retrieval timestamp (when evidence was collected) */
  retrievedAt: string;
  /** Classification: observed, reported, inferred, hypothetical */
  classification: EvidenceClassification;
  /** Source independence level */
  sourceIndependence: SourceIndependence;
  /** Verification status: verified, unverified, disputed, llm_assertion */
  verificationStatus: VerificationStatus;
  /** Confidence in this specific evidence item (0-1) */
  confidence: number;
  /** Agent/collector that provided this evidence */
  collector: string;
  /** Optional: Related dimension */
  dimension?: AssessmentDimension;
  /** Optional: Tags for filtering */
  tags?: string[];
}

export interface DimensionAssessment {
  dimension: AssessmentDimension;
  rating: DivergenceRating;
  /** Extended evidence records with full integrity metadata */
  evidence: EvidenceRecord[];
  /** Legacy string evidence for backward compatibility */
  legacyEvidence?: string[];
  assumptions: string[];
  confidence: number; // 0-1
  notes: string;
  
  // Scoring Refinement additions (Objective 3)
  /** Evidence coverage for this dimension (0-1): proportion of required evidence types collected */
  evidenceCoverage: number;
  /** Number of unresolved disagreements for this dimension */
  unresolvedDisagreementCount: number;
  /** Whether this dimension has critical divergence (rating >= 3) */
  isCritical: boolean;
}

/** Governance telemetry indicators (Objective 2) */
export interface GovernanceTelemetry {
  /** Autonomous actions per unit of time (e.g., per hour) */
  autonomousActionsPerHour: number | null;
  /** Human review throughput (reviews completed per hour) */
  humanReviewThroughputPerHour: number | null;
  /** Unreviewed action backlog count */
  unreviewedActionBacklog: number | null;
  /** Emergency intervention frequency (per week) */
  emergencyInterventionFrequencyPerWeek: number | null;
  /** Technical restoration time (mean time to restore, in minutes) */
  technicalRestorationTimeMinutes: number | null;
  /** Institutional validation time (mean time to validate, in hours) */
  institutionalValidationTimeHours: number | null;
  /** Operational backlog clearance time (mean time to clear, in hours) */
  operationalBacklogClearanceTimeHours: number | null;
  /** Dependency on external expertise (0-1 scale, or null if unavailable) */
  externalExpertiseDependency: number | null;
  /** Measurement timestamp */
  measuredAt: string;
  /** Which metrics were actually measured vs unavailable */
  measurementAvailability: {
    autonomousActionsPerHour: boolean;
    humanReviewThroughputPerHour: boolean;
    unreviewedActionBacklog: boolean;
    emergencyInterventionFrequencyPerWeek: boolean;
    technicalRestorationTimeMinutes: boolean;
    institutionalValidationTimeHours: boolean;
    operationalBacklogClearanceTimeHours: boolean;
    externalExpertiseDependency: boolean;
  };
}

export interface GovernanceMechanism {
  name: string;
  type: "policy" | "process" | "tool" | "role" | "review" | "audit" | "other";
  description: string;
  scope: string;
  effectiveness: "effective" | "partial" | "ineffective" | "unknown";
  evidence: EvidenceRecord[];
  legacyEvidence?: string[];
}

export interface OperationalCapability {
  name: string;
  description: string;
  category: "execution" | "decision" | "learning" | "adaptation" | "communication" | "other";
  complexity: "low" | "medium" | "high" | "critical";
  evidence: EvidenceRecord[];
  legacyEvidence?: string[];
  governingMechanisms: string[]; // References to governance mechanisms by name
  /** Telemetry specific to this capability */
  telemetry?: Partial<GovernanceTelemetry>;
}

export interface CascadingFailureRisk {
  trigger: string;
  propagationPath: string[];
  impact: string;
  likelihood: "low" | "medium" | "high";
  governanceGap: string;
  evidence: EvidenceRecord[];
  legacyEvidence?: string[];
}

export interface GovernanceDebtItem {
  description: string;
  dimension: AssessmentDimension;
  severity: "low" | "medium" | "high" | "critical";
  accumulating: boolean;
  evidence: EvidenceRecord[];
  legacyEvidence?: string[];
}

export interface UnresolvedQuestion {
  question: string;
  dimension: AssessmentDimension;
  blockingEvidence: EvidenceRecord[];
  legacyBlockingEvidence?: string[];
  priority: "low" | "medium" | "high";
}

export interface AssessmentScope {
  systemName: string;
  systemDescription: string;
  institutionalContext: string;
  boundaries: string[];
  assessmentTimestamp: string;
  assessorContext: string;
  /** Telemetry context for this assessment */
  telemetryContext?: GovernanceTelemetry;
  /** Optional Mermaid diagram defining system architecture */
  mermaidDiagram?: string;
  /** Parsed architecture elements from Mermaid */
  architectureElements?: ArchitectureElement[];
}

export interface ArchitectureElement {
  id: string;
  label: string;
  type: "system" | "component" | "actor" | "boundary" | "datastore" | "external";
  parents: string[];
  children: string[];
  metadata?: Record<string, any>;
}

/** Activity log entry for assessment lifecycle */
export interface ArbiterActivityLogEntry {
  id: string;
  assessmentId: string;
  stage: ReflexiveArbiterStage;
  agent: string;
  action: string;
  description: string;
  details?: Record<string, any>;
  timestamp: string;
  /** Severity for filtering: info, warning, critical */
  severity: "info" | "warning" | "critical";
}

/** Governance forecast for tracking prediction accuracy */
export interface GovernanceForecast {
  id: string;
  assessmentId: string;
  dimension: AssessmentDimension;
  predictedRating: DivergenceRating;
  predictor: string; // agent or "human"
  confidence: number; // 0-1
  rationale: string;
  createdAt: string;
  /** Evaluation results (filled when next assessment completes) */
  evaluation?: {
    actualRating: DivergenceRating;
    evaluatedAt: string;
    directionCorrect: boolean; // predicted direction vs actual
    absoluteError: number | null; // numeric difference
    notes: string;
  };
}

/** News trigger for evidence collection */
export interface NewsTrigger {
  id: string;
  assessmentId: string;
  newsTitle: string;
  newsUrl: string;
  newsSource: string;
  publishedAt: string;
  matchedKeywords: string[];
  triggeredDimensions: AssessmentDimension[];
  evidenceCollectorTaskId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

/** GitHub evidence source configuration */
export interface GitHubEvidenceSource {
  repo: string; // owner/repo
  token?: string; // optional GitHub token
  paths?: string[]; // specific paths to monitor
  events?: ("push" | "pull_request" | "issue" | "workflow_run")[];
}

export interface GovernanceDivergenceAssessment {
  id: string;
  version: string;
  methodologyVersion: string;
  scope: AssessmentScope;
  operationalCapabilities: OperationalCapability[];
  governanceMechanisms: GovernanceMechanism[];
  dimensionAssessments: DimensionAssessment[];
  cascadingFailureRisks: CascadingFailureRisk[];
  governanceDebt: GovernanceDebtItem[];
  unresolvedQuestions: UnresolvedQuestion[];
  
  // Scoring Refinement (Objective 3)
  /** Overall divergence score: average of known numeric ratings, excluding unknown */
  overallDivergenceScore: number;
  /** Maximum dimension divergence across all dimensions */
  maxDimensionDivergence: number | "unknown";
  /** Count of dimensions with critical divergence (rating >= 3) */
  criticalDimensionCount: number;
  /** Overall evidence coverage across all dimensions (0-1) */
  evidenceCoverage: number;
  /** Dimension-level confidence scores */
  dimensionConfidence: Record<AssessmentDimension, number>;
  /** Total unresolved disagreement count across all dimensions */
  unresolvedDisagreementCount: number;
  /** Count of dimensions rated unknown */
  unknownDimensionCount: number;
  /** Whether any critical dimension exists (rating >= 3) */
  hasCriticalDivergence: boolean;
  
  confidence: number; // 0-1 overall confidence
  evidenceLimitations: string[];
  recommendedInvestigations: string[];
  createdAt: string;
  updatedAt: string;
  scrumSessionId?: string;
}

export interface ReflexiveArbiterSession {
  id: string;
  topic: string;
  systemScope: string;
  stage: ReflexiveArbiterStage;
  participants: string[];
  currentStage: ReflexiveArbiterStage;
  results: ReflexiveArbiterStageResult[];
  finalStatus: "pending" | "complete" | "failed";
  sourceContext?: string[];
  repo?: string;
  assessment?: GovernanceDivergenceAssessment;
  createdAt: string;
  updatedAt: string;
}

export type ReflexiveArbiterStage = 
  | "scope_definition" 
  | "task_allocation" 
  | "independent_investigation" 
  | "cross_agent_review" 
  | "findings_reconciliation" 
  | "report_generation" 
  | "archival";

export interface ReflexiveArbiterStageOutput {
  scopeDefinition?: {
    systemDescription: string;
    institutionalContext: string;
    boundaries: string[];
    researchQuestions: string[];
  };
  
  taskAllocation?: {
    tasks: ResearchTask[];
    assignments: Record<string, string[]>;
  };
  
  independentInvestigation?: {
    findings: AgentFinding[];
  };
  
  crossAgentReview?: {
    reviews: PeerReview[];
    agreements: string[];
    disagreements: string[];
  };
  
  findingsReconciliation?: {
    reconciledFindings: ReconciledFinding[];
    unresolvedDisagreements: UnresolvedDisagreement[];
  };
  
  reportGeneration?: {
    assessment: GovernanceDivergenceAssessment;
    reportPath: string;
  };
  
  archival?: {
    archived: boolean;
    paths: string[];
    longitudinalComparison?: LongitudinalComparison;
  };
}

export interface ReflexiveArbiterStageResult {
  stage: ReflexiveArbiterStage;
  agent: string;
  output: ReflexiveArbiterStageOutput;
  valid: boolean;
  error?: string;
}

export interface ResearchTask {
  id: string;
  dimension: AssessmentDimension;
  description: string;
  requiredEvidence: string[];
  suggestedSources: string[];
  assignedAgent?: string;
  status: "pending" | "in_progress" | "complete" | "blocked";
  findings?: AgentFinding;
  /** Telemetry indicators to collect for this dimension */
  telemetryIndicators?: (keyof GovernanceTelemetry)[];
}

export interface AgentFinding {
  taskId: string;
  agent: string;
  dimension: AssessmentDimension;
  evidence: EvidenceRecord[];
  legacyEvidence?: string[];
  observations: string[];
  assumptions: string[];
  confidence: number;
  rating: DivergenceRating;
  rationale: string;
  timestamp: string;
  /** Telemetry collected during investigation */
  telemetry?: Partial<GovernanceTelemetry>;
}

export interface PeerReview {
  reviewer: string;
  reviewedFinding: AgentFinding;
  agreement: "agree" | "disagree" | "partial";
  comments: string;
  counterEvidence?: EvidenceRecord[];
  legacyCounterEvidence?: string[];
  alternativeRating?: DivergenceRating;
}

export interface ReconciledFinding {
  dimension: AssessmentDimension;
  consensusRating: DivergenceRating;
  consensusConfidence: number;
  supportingEvidence: EvidenceRecord[];
  legacySupportingEvidence?: string[];
  dissentingViews: UnresolvedDisagreement[];
  rationale: string;
  /** Evidence coverage for this reconciled finding */
  evidenceCoverage: number;
  /** Unresolved disagreement count for this dimension */
  unresolvedDisagreementCount: number;
}

export interface UnresolvedDisagreement {
  dimension: AssessmentDimension;
  agents: string[];
  positions: Record<string, { rating: DivergenceRating; rationale: string }>;
  blockingEvidence: EvidenceRecord[];
  legacyBlockingEvidence?: string[];
}

export interface LongitudinalComparison {
  previousAssessmentId: string;
  dimensionChanges: Record<AssessmentDimension, {
    previousRating: DivergenceRating;
    currentRating: DivergenceRating;
    change: "improved" | "worsened" | "stable" | "unknown";
    notes: string;
  }>;
  overallTrend: "improving" | "worsening" | "stable" | "mixed";
  debtTrajectory: "accumulating" | "reducing" | "stable";
  /** Telemetry trend comparison */
  telemetryTrends?: {
    metric: string;
    previous: number | null;
    current: number | null;
    change: "improved" | "worsened" | "stable" | "unavailable";
  }[];
  notes: string;
}

export interface AssessmentExport {
  markdown: string;
  json: GovernanceDivergenceAssessment;
}

export const DIVERGENCE_SCALE_DESCRIPTIONS: Record<DivergenceRating, string> = {
  0: "No divergence - Institutional governance fully matches operational capability",
  1: "Minor divergence - Governance largely adequate with small gaps",
  2: "Moderate divergence - Notable gaps in governance coverage or effectiveness",
  3: "Significant divergence - Major governance gaps requiring urgent attention",
  4: "Critical divergence - Governance fundamentally inadequate for operational risks",
  unknown: "Insufficient evidence to assess - Not evidence of governance failure",
};

export const DIMENSION_DESCRIPTIONS: Record<AssessmentDimension, string> = {
  temporal: "Execution velocity versus institutional response time",
  authority: "Technical permissions versus authorized scope",
  visibility: "Actual system activity versus institutional awareness",
  competency: "System complexity versus operator comprehension",
  recovery: "Disruption potential versus restoration capacity",
  accountability: "Decision traceability versus attributable responsibility",
};

export const EVIDENCE_CLASSIFICATION_DESCRIPTIONS: Record<EvidenceClassification, string> = {
  observed: "Directly observed by investigator or instrumented system",
  reported: "Reported by a source (document, interview, log)",
  inferred: "Derived from other evidence through reasoning",
  hypothetical: "Speculative, not yet substantiated",
};

export const VERIFICATION_STATUS_DESCRIPTIONS: Record<VerificationStatus, string> = {
  verified: "Independently verified through multiple sources",
  unverified: "Not yet verified, requires confirmation",
  disputed: "Conflicting evidence exists",
  llm_assertion: "LLM-generated assertion without independent verification - NOT verified evidence",
};

export const SOURCE_INDEPENDENCE_DESCRIPTIONS: Record<SourceIndependence, string> = {
  independent: "Source has no organizational/financial ties to assessed system",
  affiliated: "Source has some organizational relationship",
  self_reported: "Source is the assessed entity itself",
  unknown: "Independence could not be determined",
};

/** Helper to create a new evidence record with required metadata */
export function createEvidenceRecord(params: {
  content: string;
  sourceUri: string;
  publishedAt?: string | null;
  classification: EvidenceClassification;
  sourceIndependence: SourceIndependence;
  verificationStatus: VerificationStatus;
  confidence: number;
  collector: string;
  dimension?: AssessmentDimension;
  tags?: string[];
}): EvidenceRecord {
  return {
    content: params.content,
    sourceUri: params.sourceUri,
    publishedAt: params.publishedAt ?? null,
    retrievedAt: new Date().toISOString(),
    classification: params.classification,
    sourceIndependence: params.sourceIndependence,
    verificationStatus: params.verificationStatus,
    confidence: params.confidence,
    collector: params.collector,
    dimension: params.dimension,
    tags: params.tags,
  };
}

/** Helper to create LLM assertion evidence (automatically marked as unverified) */
export function createLLMAssertionEvidence(params: {
  content: string;
  collector: string;
  dimension?: AssessmentDimension;
  confidence?: number;
}): EvidenceRecord {
  return createEvidenceRecord({
    content: params.content,
    sourceUri: `llm://${params.collector}/${Date.now()}`,
    publishedAt: null,
    classification: "inferred",
    sourceIndependence: "unknown",
    verificationStatus: "llm_assertion",
    confidence: params.confidence ?? 0.3,
    collector: params.collector,
    dimension: params.dimension,
    tags: ["llm-generated"],
  });
}

/** Create activity log entry */
export function createActivityLogEntry(params: {
  assessmentId: string;
  stage: ReflexiveArbiterStage;
  agent: string;
  action: string;
  description: string;
  details?: Record<string, any>;
  severity?: "info" | "warning" | "critical";
}): ArbiterActivityLogEntry {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    assessmentId: params.assessmentId,
    stage: params.stage,
    agent: params.agent,
    action: params.action,
    description: params.description,
    details: params.details,
    timestamp: new Date().toISOString(),
    severity: params.severity ?? "info",
  };
}

/** Parse Mermaid diagram into architecture elements */
export function parseMermaidDiagram(mermaid: string): ArchitectureElement[] {
  const elements: ArchitectureElement[] = [];
  const lines = mermaid.split('\n');
  
  // Simple parser for graph TD / flowchart TD syntax
  // Matches: A[Label] --> B[Label] or A --> B
  const nodeRegex = /(\w+)\s*\[([^\]]+)\]\s*(-->)?/g;
  const edgeRegex = /(\w+)\s*-->\s*(\w+)/g;
  
  const nodeMap = new Map<string, { label: string; type: ArchitectureElement['type'] }>();
  
  // First pass: extract nodes
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) continue;
    
    // Reset regex
    nodeRegex.lastIndex = 0;
    let match;
    while ((match = nodeRegex.exec(trimmed)) !== null) {
      const id = match[1];
      const label = match[2];
      // Infer type from label or id patterns
      let type: ArchitectureElement['type'] = "component";
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('system') || lowerLabel.includes('platform')) type = "system";
      else if (lowerLabel.includes('user') || lowerLabel.includes('operator') || lowerLabel.includes('admin')) type = "actor";
      else if (lowerLabel.includes('db') || lowerLabel.includes('store') || lowerLabel.includes('cache')) type = "datastore";
      else if (lowerLabel.includes('external') || lowerLabel.includes('third') || lowerLabel.includes('api')) type = "external";
      else if (lowerLabel.includes('boundary') || lowerLabel.includes('zone') || lowerLabel.includes('perimeter')) type = "boundary";
      
      nodeMap.set(id, { label, type });
    }
  }
  
  // Build elements
  for (const [id, { label, type }] of nodeMap) {
    elements.push({
      id,
      label,
      type,
      parents: [],
      children: [],
      metadata: {}
    });
  }
  
  // Second pass: extract edges
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    edgeRegex.lastIndex = 0;
    let match;
    while ((match = edgeRegex.exec(trimmed)) !== null) {
      const fromId = match[1];
      const toId = match[2];
      
      const fromEl = elements.find(e => e.id === fromId);
      const toEl = elements.find(e => e.id === toId);
      
      if (fromEl && toEl) {
        fromEl.children.push(toId);
        toEl.parents.push(fromId);
      }
    }
  }
  
  return elements;
}

/** Extract boundaries from architecture elements */
export function extractBoundariesFromArchitecture(elements: ArchitectureElement[]): string[] {
  const boundaries = new Set<string>();
  
  for (const el of elements) {
    if (el.type === "boundary") {
      boundaries.add(el.label);
    } else if (el.type === "system") {
      boundaries.add(`${el.label} system boundary`);
    } else if (el.type === "external") {
      boundaries.add(`External dependency: ${el.label}`);
    }
  }
  
  // Add implicit boundaries from disconnected components
  const systems = elements.filter(e => e.type === "system");
  if (systems.length > 1) {
    boundaries.add("Multi-system integration boundaries");
  }
  
  return Array.from(boundaries);
}

/** Calculate forecast accuracy metrics */
export function calculateForecastAccuracy(forecasts: GovernanceForecast[]): {
  totalEvaluated: number;
  directionHitRate: number;
  meanAbsoluteError: number | null;
  byDimension: Record<AssessmentDimension, { evaluated: number; hitRate: number; meanError: number | null }>;
} {
  const evaluated = forecasts.filter(f => f.evaluation);
  const byDimension: Record<AssessmentDimension, { evaluated: number; correct: number; errors: number[] }> = {
    temporal: { evaluated: 0, correct: 0, errors: [] },
    authority: { evaluated: 0, correct: 0, errors: [] },
    visibility: { evaluated: 0, correct: 0, errors: [] },
    competency: { evaluated: 0, correct: 0, errors: [] },
    recovery: { evaluated: 0, correct: 0, errors: [] },
    accountability: { evaluated: 0, correct: 0, errors: [] },
  };
  
  for (const f of evaluated) {
    if (!f.evaluation) continue;
    
    const dim = f.dimension;
    byDimension[dim].evaluated++;
    if (f.evaluation.directionCorrect) byDimension[dim].correct++;
    if (f.evaluation.absoluteError !== null) byDimension[dim].errors.push(f.evaluation.absoluteError);
  }
  
  const result: any = {
    totalEvaluated: evaluated.length,
    directionHitRate: evaluated.length > 0 
      ? evaluated.filter(f => f.evaluation?.directionCorrect).length / evaluated.length 
      : 0,
    meanAbsoluteError: null,
    byDimension: {}
  };
  
  const allErrors = evaluated.map(f => f.evaluation?.absoluteError).filter((e): e is number => e !== null && e !== undefined);
  if (allErrors.length > 0) {
    result.meanAbsoluteError = allErrors.reduce((a, b) => a + b, 0) / allErrors.length;
  }
  
  for (const dim of Object.keys(byDimension) as AssessmentDimension[]) {
    const d = byDimension[dim];
    result.byDimension[dim] = {
      evaluated: d.evaluated,
      hitRate: d.evaluated > 0 ? d.correct / d.evaluated : 0,
      meanError: d.errors.length > 0 ? d.errors.reduce((a, b) => a + b, 0) / d.errors.length : null
    };
  }
  
  return result;
}

/** Check if evidence is a verified, non-LLM source */
export function isVerifiedIndependentEvidence(evidence: EvidenceRecord): boolean {
  return evidence.verificationStatus === "verified" 
    && evidence.sourceIndependence === "independent"
    && evidence.classification !== "hypothetical";
}

/** Calculate evidence coverage for a dimension (0-1) */
export function calculateEvidenceCoverage(
  evidence: EvidenceRecord[],
  requiredTypes: EvidenceClassification[] = ["observed", "reported"]
): number {
  if (evidence.length === 0) return 0;
  const coveredTypes = new Set(evidence.map(e => e.classification));
  let covered = 0;
  for (const req of requiredTypes) {
    if (coveredTypes.has(req)) covered++;
  }
  return covered / requiredTypes.length;
}