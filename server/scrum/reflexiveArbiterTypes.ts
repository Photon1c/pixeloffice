/**
 * Reflexive Arbiter — Governance Divergence Assessment Types
 * 
 * Extends Pixel Office's SCRUM infrastructure to support structured assessments
 * of institutional governance capacity relative to autonomous system capabilities.
 */

export type DivergenceRating = 0 | 1 | 2 | 3 | 4 | "unknown";

export type AssessmentDimension = 
  | "temporal" 
  | "authority" 
  | "visibility" 
  | "competency" 
  | "recovery" 
  | "accountability";

export interface DimensionAssessment {
  dimension: AssessmentDimension;
  rating: DivergenceRating;
  evidence: string[];
  assumptions: string[];
  confidence: number; // 0-1
  notes: string;
}

export interface GovernanceMechanism {
  name: string;
  type: "policy" | "process" | "tool" | "role" | "review" | "audit" | "other";
  description: string;
  scope: string;
  effectiveness: "effective" | "partial" | "ineffective" | "unknown";
  evidence: string[];
}

export interface OperationalCapability {
  name: string;
  description: string;
  category: "execution" | "decision" | "learning" | "adaptation" | "communication" | "other";
  complexity: "low" | "medium" | "high" | "critical";
  evidence: string[];
  governingMechanisms: string[]; // References to governance mechanisms by name
}

export interface CascadingFailureRisk {
  trigger: string;
  propagationPath: string[];
  impact: string;
  likelihood: "low" | "medium" | "high";
  governanceGap: string;
}

export interface GovernanceDebtItem {
  description: string;
  dimension: AssessmentDimension;
  severity: "low" | "medium" | "high" | "critical";
  accumulating: boolean;
  evidence: string[];
}

export interface UnresolvedQuestion {
  question: string;
  dimension: AssessmentDimension;
  blockingEvidence: string[];
  priority: "low" | "medium" | "high";
}

export interface AssessmentScope {
  systemName: string;
  systemDescription: string;
  institutionalContext: string;
  boundaries: string[];
  assessmentTimestamp: string;
  assessorContext: string;
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
  overallDivergenceScore: number; // 0-4 average, excluding unknown
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
  // Scope Definition
  scopeDefinition?: {
    systemDescription: string;
    institutionalContext: string;
    boundaries: string[];
    researchQuestions: string[];
  };
  
  // Task Allocation
  taskAllocation?: {
    tasks: ResearchTask[];
    assignments: Record<string, string[]>; // agent -> task ids
  };
  
  // Independent Investigation
  independentInvestigation?: {
    findings: AgentFinding[];
  };
  
  // Cross Agent Review
  crossAgentReview?: {
    reviews: PeerReview[];
    agreements: string[];
    disagreements: string[];
  };
  
  // Findings Reconciliation
  findingsReconciliation?: {
    reconciledFindings: ReconciledFinding[];
    unresolvedDisagreements: UnresolvedDisagreement[];
  };
  
  // Report Generation
  reportGeneration?: {
    assessment: GovernanceDivergenceAssessment;
    reportPath: string;
  };
  
  // Archival
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
}

export interface AgentFinding {
  taskId: string;
  agent: string;
  dimension: AssessmentDimension;
  evidence: string[];
  observations: string[];
  assumptions: string[];
  confidence: number;
  rating: DivergenceRating;
  rationale: string;
  timestamp: string;
}

export interface PeerReview {
  reviewer: string;
  reviewedFinding: AgentFinding;
  agreement: "agree" | "disagree" | "partial";
  comments: string;
  counterEvidence?: string[];
  alternativeRating?: DivergenceRating;
}

export interface ReconciledFinding {
  dimension: AssessmentDimension;
  consensusRating: DivergenceRating;
  consensusConfidence: number;
  supportingEvidence: string[];
  dissentingViews: UnresolvedDisagreement[];
  rationale: string;
}

export interface UnresolvedDisagreement {
  dimension: AssessmentDimension;
  agents: string[];
  positions: Record<string, { rating: DivergenceRating; rationale: string }>;
  blockingEvidence: string[];
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