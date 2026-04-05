import { getActiveResidues } from "./residueLogger";
import { analyzeOfficeResidues } from "./reviewHeatEngine";
import { getActiveHeat } from "../cooler/reviewHeat";
import { getActiveTraces } from "../cooler/stigmergy";

// Promotion thresholds - when residue should be promoted to office objects
export interface PromotionThresholds {
  review_heat_to_scrum: number;      // 0.7 - when to create SCUM from review heat
  task_shadow_to_policy: number;     // 0.6 - when to create policy from task shadows
  delegation_to_sop: number;         // 0.8 - when to create SOP from delegation patterns
  spatial_to_routing: number;        // 0.7 - when to adjust routing from spatial patterns
  outcome_to_memory: number;         // 0.75 - when to strengthen memory from outcomes
}

// Promotion results
export interface PromotionResult {
  promoted: boolean;
  promotion_type: string; // "scrum_seed", "policy", "sop", "routing_rule", "memory_strengthen"
  title: string;
  description: string;
  rationale: string;
  source_residues: string[]; // IDs of residues that triggered promotion
  metadata?: Record<string, any>;
}

// Main promotion function - evaluates residues and promotes when thresholds crossed
export function evaluatePromotions(): PromotionResult[] {
  const thresholds: PromotionThresholds = {
    review_heat_to_scrum: 0.7,
    task_shadow_to_policy: 0.6,
    delegation_to_sop: 0.8,
    spatial_to_routing: 0.7,
    outcome_to_memory: 0.75
  };
  
  const promotions: PromotionResult[] = [];
  
  // Get current office analysis
  const analysis = analyzeOfficeResidues();
  const residues = getActiveResidues();
  
  // 1. Check if review heat should promote to SCUM seed
  if (analysis.review_heat >= thresholds.review_heat_to_scrum) {
    const scrumPromotion = promoteReviewHeatToScrum(analysis, residues);
    if (scrumPromotion) promotions.push(scrumPromotion);
  }
  
  // 2. Check if task shadow should promote to policy
  if (analysis.task_shadow >= thresholds.task_shadow_to_policy) {
    const policyPromotion = promoteTaskShadowToPolicy(analysis, residues);
    if (policyPromotion) promotions.push(policyPromotion);
  }
  
  // 3. Check if delegation patterns should promote to SOP
  const delegationConfidence = Object.values(analysis.delegation_confidence) as number[];
  const avgDelegationConfidence = delegationConfidence.length > 0 
    ? delegationConfidence.reduce((sum, conf) => sum + conf, 0) / delegationConfidence.length 
    : 0;
    
  if (avgDelegationConfidence >= thresholds.delegation_to_sop) {
    const sopPromotion = promoteDelegationToSop(analysis, residues);
    if (sopPromotion) promotions.push(sopPromotion);
  }
  
  // 4. Check if spatial patterns should promote to routing rules
  const spatialResidues = residues.filter(r => r.trace_type === "spatial_residue") as any[];
  const highIntensitySpatial = spatialResidues.filter(r => r.intensity >= thresholds.spatial_to_routing);
  
  if (highIntensitySpatial.length > 0) {
    const routingPromotion = promoteSpatialToRouting(highIntensitySpatial, analysis);
    if (routingPromotion) promotions.push(routingPromotion);
  }
  
  // 5. Check if outcomes should promote to memory strengthening
  const outcomeResidues = residues.filter(r => r.trace_type === "outcome_residue") as any[];
  const successfulOutcomes = outcomeResidues.filter(r => 
    r.outcome_type === 'completed' || 
    (r.success_metrics && r.success_metrics.usefulness_score >= thresholds.outcome_to_memory)
  );
  
  if (successfulOutcomes.length >= 3) { // Need multiple successes to strengthen memory
    const memoryPromotion = promoteOutcomeToMemory(successfulOutcomes, analysis);
    if (memoryPromotion) promotions.push(memoryPromotion);
  }
  
  return promotions;
}

// Promote review heat to SCUM seed
function promoteReviewHeatToScrum(analysis: any, residues: any[]): PromotionResult | null {
  // Find review-related conversation residues
  const convResidues = residues.filter(r => r.trace_type === "conversation_residue") as any[];
  const reviewRelated = convResidues.filter(r => 
    r.topic.toLowerCase().includes('review') || 
    r.topic.toLowerCase().includes('pr') ||
    r.topic.toLowerCase().includes('pull request') ||
    r.topic.toLowerCase().includes('backlog') ||
    r.topic.toLowerCase().includes('blocked') ||
    r.topic.toLowerCase().includes('approval') ||
    r.topic.toLowerCase().includes('stale') ||
    r.topic.toLowerCase().includes('merge') ||
    r.topic.toLowerCase().includes('bottleneck')
  );
  
  if (reviewRelated.length === 0) return null;
  
  // Find the most actionable review-related conversation
  const mostActionable = reviewRelated.reduce((prev, current) => {
    const prevAction = prev.signals?.actionability || 0;
    const currAction = current.signals?.actionability || 0;
    return currAction > prevAction ? current : prev;
  });
  
  // Generate SCUM seed title based on topic and actionability
  const title = `SCRUM: Review Improvement - ${mostActionable.topic}`;
  const description = `Address review bottlenecks identified in office conversations. ` +
    `Topics: ${reviewRelated.map(r => r.topic).join(', ')}. ` +
    `Actionability score: ${mostActionable.signals?.actionability?.toFixed(2) || 'N/A'}.`;
  
  const rationale = `Review heat level (${analysis.review_heat.toFixed(2)}) exceeds threshold (${0.7}). ` +
    `Multiple review-related conversations detected with high actionability.`;
  
  return {
    promoted: true,
    promotion_type: "scrum_seed",
    title,
    description,
    rationale,
    source_residues: reviewRelated.map(r => r.id),
    metadata: {
      review_heat_level: analysis.review_heat,
      suggested_action: "create_scrum",
      originating_sessions: [...new Set(reviewRelated.map(r => r.source_session_id))],
      recommended_owner: determineRecommendedOwner(reviewRelated, analysis.delegation_confidence),
      related_topics: reviewRelated.map(r => r.topic)
    }
  };
}

// Promote task shadow to policy
function promoteTaskShadowToPolicy(analysis: any, residues: any[]): PromotionResult | null {
  // Find task-related residues with issues
  const taskResidues = residues.filter(r => r.trace_type === "task_residue") as any[];
  const problematicTasks = taskResidues.filter(t => 
    t.status === 'blocked' || 
    t.status === 'died' ||
    (t.outcome && t.outcome.dead_end) ||
    (t.outcome && t.outcome.spawned_followup_tasks > 2)
  );
  
  if (problematicTasks.length < 2) return null; // Need multiple instances to create policy
  
  // Group by similar issues
  const issueGroups: Record<string, any[]> = {};
  problematicTasks.forEach(task => {
    // Simple grouping by status/outcome type
    const issueType = task.status || 
      (task.outcome?.dead_end ? 'dead_end' : 
       task.outcome?.spawned_followup_tasks > 2 ? 'followup_heavy' : 'other');
    if (!issueGroups[issueType]) issueGroups[issueType] = [];
    issueGroups[issueType].push(task);
  });
  
  // Find the most common issue type
  let mostCommonIssue = '';
  let maxCount = 0;
  Object.entries(issueGroups).forEach(([type, tasks]) => {
    if (tasks.length > maxCount) {
      maxCount = tasks.length;
      mostCommonIssue = type;
    }
  });
  
  if (maxCount < 2) return null;
  
  const tasksForPolicy = issueGroups[mostCommonIssue];
  
  // Generate policy title
  const title = `POLICY: Task Management Improvement - ${mostCommonIssue}`;
  const description = `Establish clear guidelines for handling ${mostCommonIssue} tasks. ` +
    `Based on ${tasksForPolicy.length} observed instances. ` +
    `Common characteristics: ${getCommonTaskCharacteristics(tasksForPolicy)}.`;
  
  const rationale = `Task shadow level (${analysis.task_shadow.toFixed(2)}) exceeds threshold (${0.6}). ` +
    `${tasksForPolicy.length} tasks show similar problematic patterns requiring policy intervention.`;
  
  return {
    promoted: true,
    promotion_type: "policy",
    title,
    description,
    rationale,
    source_residues: tasksForPolicy.map(t => t.id),
    metadata: {
      task_shadow_level: analysis.task_shadow,
      policy_type: mostCommonIssue,
      affected_task_count: tasksForPolicy.length,
      enforcement_suggested: "warning_then_escalation",
      review_period: "weekly"
    }
  };
}

// Promote delegation patterns to SOP
function promoteDelegationToSop(analysis: any, residues: any[]): PromotionResult | null {
  // Find delegation residues
  const delegationResidues = residues.filter(r => r.trace_type === "delegation_residue") as any[];
  
  if (delegationResidues.length < 3) return null; // Need sufficient delegation data
  
  // Find agents with high confidence (trusted delegates)
  const delegationEntries = Object.entries(analysis.delegation_confidence) as [string, number][];
  const trustedAgents = delegationEntries
    .filter(([_, confidence]) => confidence >= 0.7)
    .map(([agentId, _]) => agentId);
  
  if (trustedAgents.length === 0) return null;
  
  // Find delegation patterns involving trusted agents
  const trustedDelegations = delegationResidues.filter(d => 
    trustedAgents.includes(d.delegatee as string) || trustedAgents.includes(d.delegator as string)
  );
  
  if (trustedDelegations.length < 2) return null;
  
  // Determine most common delegation type
    const delegationTypes: Record<string, number> = {};
    trustedDelegations.forEach(d => {
      const type = (d.request_type !== undefined ? d.request_type : 'general_help') as string;
      delegationTypes[type] = (delegationTypes[type] || 0) + 1;
    });
  
  let mostCommonType = 'general_help';
  let maxCount = 0;
  Object.entries(delegationTypes).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  });
  
  // Find examples of this delegation type
  const examples = trustedDelegations.filter(d => String(d.request_type) === mostCommonType);
  
  const title = `SOP: Delegation Protocol - ${mostCommonType}`;
  const description = `Standard operating procedure for ${mostCommonType} requests. ` +
    `Based on observation of ${examples.length} successful delegations. ` +
    `Trusted agents: ${trustedAgents.join(', ')}.`;
  
  const rawDelegationValues = Object.values(analysis.delegation_confidence);
  const delegationValues = rawDelegationValues.filter((val): val is number => typeof val === 'number') as number[];
  const avgConfidence = delegationValues.length > 0 
    ? delegationValues.reduce((sum, c) => sum + c, 0) / delegationValues.length 
    : 0;
  const rationale = `Delegation confidence average (${avgConfidence.toFixed(2)}) exceeds threshold (${0.8}). ` +
    `Trusted agents consistently handle ${mostCommonType} requests effectively.`;
  
  return {
    promoted: true,
    promotion_type: "sop",
    title,
    description,
    rationale,
    source_residues: examples.map(e => e.id),
  metadata: {
    delegation_confidence: avgConfidence,
    trusted_agents: trustedAgents,
    sop_type: mostCommonType,
    success_rate: calculateDelegationSuccessRate(examples),
      review_triggers: ["new_agent_onboarding", "process_change"]
    }
  };
}

// Promote spatial patterns to routing rules
function promoteSpatialToRouting(spatialResidues: any[], analysis: any): PromotionResult | null {
  if (spatialResidues.length === 0) return null;
  
  // Group by location
  const locationGroups: Record<string, any[]> = {};
  spatialResidues.forEach(residue => {
    const location = residue.location;
    if (!locationGroups[location]) locationGroups[location] = [];
    locationGroups[location].push(residue);
  });
  
  // Find locations with high intensity and recurring patterns
  const routingCandidates: Array<{
    location: string;
    avgIntensity: number;
    eventTypes: string[];
    frequency: number;
  }> = [];
  
  Object.entries(locationGroups).forEach(([location, residues]) => {
    const avgIntensity = residues.reduce((sum, r) => sum + r.intensity, 0) / residues.length;
    const eventTypes = [...new Set(residues.map(r => r.event_type))];
    const frequency = residues.length;
    
    if (avgIntensity >= 0.6 && frequency >= 2) {
      routingCandidates.push({
        location,
        avgIntensity,
        eventTypes,
        frequency
      });
    }
  });
  
  if (routingCandidates.length === 0) return null;
  
  // Pick the strongest candidate
  const bestCandidate = routingCandidates.reduce((prev, current) => 
    (current.avgIntensity * current.frequency) > (prev.avgIntensity * prev.frequency) ? current : prev
  );
  
  // Generate routing rule
  const title = `ROUTING RULE: Optimize ${bestCandidate.location} for ${bestCandidate.eventTypes.join(' & ')}`;
  const description = `Route ${bestCandidate.eventTypes.join(' or ')} activities to ${bestCandidate.location} based on observed patterns. ` +
    `Average intensity: ${bestCandidate.avgIntensity.toFixed(2)} over ${bestCandidate.frequency} observations. ` +
    `Suggested adjustment: increase routing preference by ${Math.min(0.3, (bestCandidate.avgIntensity - 0.5) * 2).toFixed(2)}.`;
  
  const rationale = `Spatial residue intensity (${bestCandidate.avgIntensity.toFixed(2)}) exceeds threshold (${0.7}) ` +
    `with recurring patterns (${bestCandidate.frequency} instances). ` +
    `Clear behavioral pattern detected for ${bestCandidate.location}.`;
  
  return {
    promoted: true,
    promotion_type: "routing_rule",
    title,
    description,
    rationale,
    source_residues: spatialResidues.map(r => r.id),
    metadata: {
      location: bestCandidate.location,
      event_types: bestCandidate.eventTypes,
      strength: bestCandidate.avgIntensity,
      frequency: bestCandidate.frequency,
      suggested_routing_adjustment: Math.min(0.3, (bestCandidate.avgIntensity - 0.5) * 2),
      time_window: "ongoing",
      applies_to_agents: "all"
    }
  };
}

// Promote outcomes to memory strengthening
function promoteOutcomeToMemory(successfulOutcomes: any[], analysis: any): PromotionResult | null {
  if (successfulOutcomes.length < 3) return null;
  
  // Analyze what made these outcomes successful
  const successFactors: Record<string, number> = {};
  
  successfulOutcomes.forEach(outcome => {
    // Factor in usefulness score
    const usefulness = outcome.success_metrics?.usefulness_score || 0.5;
    successFactors.usefulness = (successFactors.usefulness || 0) + usefulness;
    
    // Factor in time efficiency (faster is better, but normalize)
    const timeFactor = outcome.success_metrics?.time_to_completion ? 
      Math.max(0, 1 - (outcome.success_metrics.time_to_completion / 120)) : 0.5; // normalize against 2 hours
    successFactors.time_efficiency = (successFactors.time_efficiency || 0) + timeFactor;
    
     // Factor in quality indicators
     const qualityIndicatorValues = Object.values(outcome.success_metrics?.quality_indicators || {});
     const numericQualityValues = qualityIndicatorValues.filter((val): val is number => typeof val === 'number');
     const qualityScore = numericQualityValues.length > 0 
         ? numericQualityValues.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0.5), 0) / numericQualityValues.length
         : 0.5;
    successFactors.quality = (successFactors.quality || 0) + (qualityScore || 0.5);
  });
  
  // Average the success factors
  const count = successfulOutcomes.length;
  const avgUsefulness = successFactors.usefulness / count;
  const avgTimeEfficiency = successFactors.time_efficiency / count;
  const avgQuality = successFactors.quality / count;
  
  const title = `MEMORY STRENGTHEN: Successful Pattern Reinforcement`;
  const description = `Reinforce successful office patterns based on ${count} successful outcomes. ` +
    `Average usefulness: ${avgUsefulness.toFixed(2)}, ` +
    `Time efficiency: ${avgTimeEfficiency.toFixed(2)}, ` +
    `Quality: ${avgQuality.toFixed(2)}.`;
  
  const rationale = `Outcome success rate indicates learnable patterns. ` +
    `${count} successful outcomes exceeded threshold (${0.75}). ` +
    `Office should strengthen memory of these effective approaches.`;
  
  return {
    promoted: true,
    promotion_type: "memory_strengthen",
    title,
    description,
    rationale,
    source_residues: successfulOutcomes.map(o => o.id),
    metadata: {
      outcome_count: successfulOutcomes.length,
      success_metrics: {
        usefulness: avgUsefulness,
        time_efficiency: avgTimeEfficiency,
        quality: avgQuality
      },
      reinforcement_type: "pattern_matching",
      decay_resistance: Math.min(0.9, avgUsefulness * 0.8 + 0.1),
      applicable_contexts: extractCommonContexts(successfulOutcomes)
    }
  };
}

// Helper function to determine recommended owner based on delegation confidence
function determineRecommendedOwner(residues: any[], delegationConfidence: Record<string, number>): string {
  if (Object.keys(delegationConfidence).length === 0) return "OpenClaw"; // default
  
  // Find agents mentioned in these residues
  const agentMentions: Record<string, number> = {};
  residues.forEach(residue => {
    // Look for participants in conversation residues
    if (residue.participants) {
      residue.participants.forEach((agent: string) => {
        agentMentions[agent] = (agentMentions[agent] || 0) + 1;
      });
    }
    // Look for delegator/delegatee in delegation residues
    if (residue.delegator) agentMentions[residue.delegator] = (agentMentions[residue.delegator] || 0) + 1;
    if (residue.delegatee) agentMentions[residue.delegatee] = (agentMentions[residue.delegatee] || 0) + 1;
  });
  
  // Find agent with highest combination of mentions and confidence
  let bestAgent = "OpenClaw";
  let bestScore = 0;
  
  Object.entries(agentMentions).forEach(([agent, mentions]) => {
    const confidence = delegationConfidence[agent] || 0.5;
    const score = mentions * (0.5 + confidence * 0.5); // weight both factors
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  });
  
  return bestAgent;
}

// Helper function to get common task characteristics
function getCommonTaskCharacteristics(tasks: any[]): string {
  if (tasks.length === 0) return "no common characteristics identified";
  
  const statuses = [...new Set(tasks.map(t => t.status))];
  const outcomes = [...new Set(tasks.map(t => t.outcome?.dead_end ? 'dead_end' : 
                           t.outcome?.spawned_followup_tasks > 2 ? 'followup_heavy' : 
                           t.status))];
  
  let desc = "";
  if (statuses.length === 1) desc += `All tasks are ${statuses[0]}. `;
  if (outcomes.length === 1 && outcomes[0] !== 'pending') desc += `All show ${outcomes[0]} pattern. `;
  
  // Check timing patterns
  const completionTimes = tasks.map(t => t.outcome?.completion_time).filter(t => t !== undefined);
  if (completionTimes.length >= 2) {
    const avgTime = completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length;
    desc += `Average completion time: ${Math.round(avgTime)} minutes. `;
  }
  
  return desc.trim() || "varied characteristics requiring standardization";
}

// Helper function to calculate delegation success rate
function calculateDelegationSuccessRate(delegations: any[]): number {
  if (delegations.length === 0) return 0.5;
  
  let successScore = 0;
  delegations.forEach(d => {
    const indicators = d.success_indicators || {};
    let delegSuccess = 0.5; // base
    
    if (indicators.useful_artifact_created) delegSuccess += 0.2;
    if (indicators.followup_requests < 2) delegSuccess += 0.15; // few followups good
    if (indicators.escalation_rate < 0.3) delegSuccess += 0.15; // low escalation good
    if (indicators.solution_quality > 0.7) delegSuccess += 0.2;
    
    successScore += Math.min(1, delegSuccess);
  });
  
  return successScore / delegations.length;
}

// Helper function to extract common contexts from successful outcomes
function extractCommonContexts(outcomes: any[]): string[] {
  if (outcomes.length === 0) return ["general"];
  
  // Extract source sessions as contexts
  const sessions = [...new Set(outcomes.map(o => o.source_session_id))];
  return sessions.length > 0 ? sessions : ["general"];
}