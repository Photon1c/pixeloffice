import { getActiveResidues } from "./residueLogger";
import { analyzeOfficeResidues } from "./reviewHeatEngine";
import { evaluatePromotions } from "./promotionEngine";

// Adaptation rules - how the office should change based on learned patterns
export interface AdaptationRule {
  id: string;
  type: "routing" | "delegation" | "ui_emphasis" | "scrum_prioritization" | "memory_decay";
  condition: string; // human-readable description of when this applies
  action: string; // what to do when condition is met
  priority: number; // 1-10, higher priority overrides lower
  ttl?: number; // time to live in milliseconds, undefined = permanent
  metadata?: Record<string, any>;
}

// Current adaptations applied to the office
export interface AppliedAdaptations {
  routing_rules: AdaptationRule[];
  delegation_preferences: AdaptationRule[];
  ui_emphasis: AdaptationRule[];
  scrum_prioritization: AdaptationRule[];
  memory_settings: AdaptationRule[];
}

// Main adaptation function - evaluates office state and returns adaptations
export function evaluateAdaptations(): AppliedAdaptations {
  const analysis = analyzeOfficeResidues();
  const promotions = evaluatePromotions();
  const residues = getActiveResidues();
  
  const adaptations: AppliedAdaptations = {
    routing_rules: [],
    delegation_preferences: [],
    ui_emphasis: [],
    scrum_prioritization: [],
    memory_settings: []
  };
  
  // 1. Routing adaptations from spatial residues and promotions
  adaptations.routing_rules = evaluateRoutingAdaptations(analysis, residues, promotions);
  
  // 2. Delegation adaptations from delegation residues and confidence scores
  adaptations.delegation_preferences = evaluateDelegationAdaptations(analysis, residues, promotions);
  
  // 3. UI emphasis adaptations from office mood and heat indicators
  adaptations.ui_emphasis = evaluateUiEmphasisAdaptations(analysis, residues, promotions);
  
  // 4. SCRUM prioritization adaptations from review heat and topic persistence
  adaptations.scrum_prioritization = evaluateScrumPrioritizationAdaptations(analysis, residues, promotions);
  
  // 5. Memory settings adaptations from outcome residues and success patterns
  adaptations.memory_settings = evaluateMemoryAdaptations(analysis, residues, promotions);
  
  return adaptations;
}

// Evaluate routing adaptations based on spatial patterns
function evaluateRoutingAdaptations(
  analysis: any,
  residues: any[],
  promotions: any[]
): AdaptationRule[] {
  const rules: AdaptationRule[] = [];
  
  // Look for spatial promotions that suggest routing changes
  const routingPromotions = promotions.filter((p: any) => p.promotion_type === "routing_rule");
  
  routingPromotions.forEach((promo: any) => {
    if (promo.metadata) {
      const rule: AdaptationRule = {
        id: `route-${promo.metadata.location}-${Date.now()}`,
        type: "routing",
        condition: `High intensity ${promo.metadata.event_types.join(' or ')} activity in ${promo.metadata.location}`,
        action: `Increase routing preference for ${promo.metadata.event_types.join(' or ')} to ${promo.metadata.location} by ${promo.metadata.suggested_routing_adjustment}`,
        priority: Math.floor(promo.metadata.strength * 10),
        ttl: promo.metadata.time_window === "ongoing" ? undefined : 24 * 60 * 60 * 1000, // 1 day if not ongoing
        metadata: {
          location: promo.metadata.location,
          event_types: promo.metadata.event_types,
          strength: promo.metadata.strength,
          adjustment: promo.metadata.suggested_routing_adjustment
        }
      };
      rules.push(rule);
    }
  });
  
  // Add ongoing routing preferences based on spatial residue analysis
  const spatialResidues = residues.filter(r => r.trace_type === "spatial_residue") as any[];
  const locationScores: Record<string, number> = {};
  
  spatialResidues.forEach(residue => {
    const location = residue.location;
    if (!locationScores[location]) locationScores[location] = 0;
    locationScores[location] += residue.intensity;
  });
  
  // Create routing rules for consistently high-intensity locations
  Object.entries(locationScores).forEach(([location, totalIntensity]) => {
    const count = spatialResidues.filter(r => r.location === location).length;
    const avgIntensity = totalIntensity / Math.max(1, count);
    
    if (avgIntensity >= 0.6 && count >= 2) {
      // Determine dominant event type for this location
      const locationResidues = spatialResidues.filter(r => r.location === location);
      const eventTypes: Record<string, number> = {};
      locationResidues.forEach(r => {
        const type = r.event_type;
        eventTypes[type] = (eventTypes[type] || 0) + 1;
      });
      
      let dominantEvent = "general";
      let maxCount = 0;
      Object.entries(eventTypes).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantEvent = type;
        }
      });
      
      const rule: AdaptationRule = {
        id: `route-base-${location}-${Date.now()}`,
        type: "routing",
        condition: `Consistently high ${dominantEvent} activity in ${location} (avg intensity: ${avgIntensity.toFixed(2)})`,
        action: `Set baseline routing preference for ${dominantEvent} to ${location} with strength ${Math.min(0.8, avgIntensity * 0.8)}`,
        priority: Math.floor(avgIntensity * 8),
        ttl: 6 * 60 * 60 * 1000, // 6 hours
        metadata: {
          location,
          event_type: dominantEvent,
          intensity: avgIntensity,
          base_routing_strength: Math.min(0.8, avgIntensity * 0.8)
        }
      };
      rules.push(rule);
    }
  });
  
  return rules;
}

// Evaluate delegation adaptations based on confidence scores and patterns
function evaluateDelegationAdaptations(
  analysis: any,
  residues: any[],
  promotions: any[]
): AdaptationRule[] {
  const rules: AdaptationRule[] = [];
  
  // Look for SOP promotions that suggest delegation patterns
  const sopPromotions = promotions.filter((p: any) => p.promotion_type === "sop");
  
  sopPromotions.forEach((promo: any) => {
    if (promo.metadata) {
      const rule: AdaptationRule = {
        id: `deleg-sop-${promo.metadata.sop_type}-${Date.now()}`,
        type: "delegation",
        condition: `High confidence delegation pattern for ${promo.metadata.sop_type}`,
        action: `Prefer routing ${promo.metadata.sop_type} requests to trusted agents: ${promo.metadata.trusted_agents.join(', ')}`,
        priority: Math.floor(promo.metadata.delegation_confidence * 10),
        ttl: promo.metadata.review_triggers ? 2 * 60 * 60 * 1000 : undefined, // 2 hours unless reviewed
        metadata: {
          sop_type: promo.metadata.sop_type,
          trusted_agents: promo.metadata.trusted_agents,
          confidence: promo.metadata.delegation_confidence,
          success_rate: promo.metadata.success_rate
        }
      };
      rules.push(rule);
    }
  });
  
  // Add ongoing delegation preferences from confidence scores
  const delegationConfidence = analysis.delegation_confidence;
  Object.entries(delegationConfidence).forEach(([agentId, confidenceValue]) => {
    const confidence = confidenceValue as number;
    if (confidence >= 0.6) { // Only adapt for reasonably confident agents
      // Determine what this agent is good at based on delegation history
      const delegationResidues = residues.filter(r => 
        r.trace_type === "delegation_residue" && 
        (r as any).delegatee === agentId
      ) as any[];
      
      if (delegationResidues.length >= 2) {
        // Find most common request type for this agent
        const requestTypes: Record<string, number> = {};
        delegationResidues.forEach(r => {
          const type = (r as any).request_type !== undefined ? (r as any).request_type : 'general';
          requestTypes[type] = (requestTypes[type] || 0) + 1;
        });
        
        let topRequestType = 'general';
        let maxCount = 0;
        Object.entries(requestTypes).forEach(([type, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topRequestType = type;
          }
        });
        
        const rule: AdaptationRule = {
          id: `deleg-pref-${agentId}-${Date.now()}`,
          type: "delegation",
          condition: `Agent ${agentId} has ${(confidence * 100).toFixed(0)}% confidence in handling requests`,
          action: `Route ${topRequestType} requests to ${agentId} with preference weight ${(confidence * 0.8 + 0.2).toFixed(2)}`,
          priority: Math.floor(confidence * 8),
          ttl: 4 * 60 * 60 * 1000, // 4 hours
          metadata: {
            agent_id: agentId,
            confidence,
            preferred_request_type: topRequestType,
            preference_weight: confidence * 0.8 + 0.2
          }
        };
        rules.push(rule);
      }
    }
  });
  
  return rules;
}

// Evaluate UI emphasis adaptations based on office mood and heat
function evaluateUiEmphasisAdaptations(
  analysis: any,
  residues: any[],
  promotions: any[]
): AdaptationRule[] {
  const rules: AdaptationRule[] = [];
  
  // UI emphasis from office mood
  const mood = analysis.office_mood;
  
  // High negative valence -> emphasize problem-solving UI elements
  if (mood.valence < -0.3) {
    const rule: AdaptationRule = {
      id: `ui-emph-problem-${Date.now()}`,
      type: "ui_emphasis",
      condition: `Office mood negative (valence: ${mood.valence.toFixed(2)})`,
      action: "Increase visibility of problem-solving tools, blocker indicators, and escalation paths",
      priority: Math.floor((-mood.valence) * 10),
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      metadata: {
        mood_valence: mood.valence,
        ui_elements: ["blocker_indicators", "escalation_paths", "problem_tools"],
        emphasis_level: Math.min(1, -mood.valence * 2)
      }
    };
    rules.push(rule);
  }
  
  // High arousal -> emphasize calming/UI simplification elements
  if (mood.arousal > 0.7) {
    const rule: AdaptationRule = {
      id: `ui-emph-calm-${Date.now()}`,
      type: "ui_emphasis",
      condition: `Office arousal high (arousal: ${mood.arousal.toFixed(2)})`,
      action: "Simplify UI, reduce notifications, emphasize focus modes and calm indicators",
      priority: Math.floor((mood.arousal - 0.5) * 10),
      ttl: 90 * 60 * 1000, // 90 minutes
      metadata: {
        mood_arousal: mood.arousal,
        ui_elements: ["focus_mode", "notification_reduction", "calm_indicators"],
        emphasis_level: Math.min(1, (mood.arousal - 0.5) * 2)
      }
    };
    rules.push(rule);
  }
  
  // Low dominance -> emphasize empowerment/UI agency elements
  if (mood.dominance < 0.4) {
    const rule: AdaptationRule = {
      id: `ui-emph-empower-${Date.now()}`,
      type: "ui_emphasis",
      condition: `Office dominance low (dominance: ${mood.dominance.toFixed(2)})`,
      action: "Emphasize user agency, decision-making tools, and empowerment indicators",
      priority: Math.floor((0.5 - mood.dominance) * 10),
      ttl: 3 * 60 * 60 * 1000, // 3 hours
      metadata: {
        mood_dominance: mood.dominance,
        ui_elements: ["decision_tools", "empowerment_indicators", "agency_emphasis"],
        emphasis_level: Math.min(1, (0.5 - mood.dominance) * 2)
      }
    };
    rules.push(rule);
  }
  
  // High review heat -> emphasize review/progress UI elements
  if (analysis.review_heat > 0.5) {
    const rule: AdaptationRule = {
      id: `ui-emph-review-${Date.now()}`,
      type: "ui_emphasis",
      condition: `Review heat elevated (${analysis.review_heat.toFixed(2)})`,
      action: "Increase visibility of review progress indicators, PR status, and code quality metrics",
      priority: Math.floor(analysis.review_heat * 8),
      ttl: 3 * 60 * 60 * 1000, // 3 hours
      metadata: {
        review_heat: analysis.review_heat,
        ui_elements: ["review_progress", "pr_status", "code_quality"],
        emphasis_level: Math.min(1, analysis.review_heat * 1.5)
      }
    };
    rules.push(rule);
  }
  
  // High topic persistence -> emphasize trending topics UI
  if (analysis.topic_persistence > 0.6) {
    const rule: AdaptationRule = {
      id: `ui-emph-trends-${Date.now()}`,
      type: "ui_emphasis",
      condition: `Topic persistence high (${analysis.topic_persistence.toFixed(2)})`,
      action: "Highlight trending topics and persistent discussions in UI",
      priority: Math.floor(analysis.topic_persistence * 8),
      ttl: 4 * 60 * 60 * 1000, // 4 hours
      metadata: {
        topic_persistence: analysis.topic_persistence,
        ui_elements: ["trending_topics", "persistent_discussions"],
        emphasis_level: Math.min(1, analysis.topic_persistence * 1.5)
      }
    };
    rules.push(rule);
  }
  
  return rules;
}

// Evaluate SCRUM prioritization adaptations based on review heat and topic analysis
function evaluateScrumPrioritizationAdaptations(
  analysis: any,
  residues: any[],
  promotions: any[]
): AdaptationRule[] {
  const rules: AdaptationRule[] = [];
  
  // Look for SCUM seed promotions that suggest prioritization
  const scrumPromotions = promotions.filter((p: any) => p.promotion_type === "scrum_seed");
  
  scrumPromotions.forEach((promo: any) => {
    if (promo.metadata) {
      const rule: AdaptationRule = {
        id: `scrum-prio-${Date.now()}`,
        type: "scrum_prioritization",
        condition: `Review heat suggests SCUM creation: ${promo.title}`,
        action: `Prioritize SCUM items related to ${promo.metadata.related_topics.join(' or ')}`,
        priority: Math.floor(promo.metadata.review_heat_level * 10),
        ttl: 6 * 60 * 60 * 1000, // 6 hours
        metadata: {
          review_heat_level: promo.metadata.review_heat_level,
          related_topics: promo.metadata.related_topics,
          suggested_action: promo.metadata.suggested_action,
          recommended_owner: promo.metadata.recommended_owner
        }
      };
      rules.push(rule);
    }
  });
  
  // Add ongoing prioritization based on topic persistence and drift
  if (analysis.topic_persistence > 0.5) {
    const rule: AdaptationRule = {
      id: `scrum-prio-persist-${Date.now()}`,
      type: "scrum_prioritization",
      condition: `Persistent topics detected (persistence: ${analysis.topic_persistence.toFixed(2)})`,
      action: "Increase priority of SCUM items related to persistent topics",
      priority: Math.floor(analysis.topic_persistence * 8),
      ttl: 4 * 60 * 60 * 1000, // 4 hours
      metadata: {
        topic_persistence: analysis.topic_persistence,
        growing_topics: analysis.drift_indicators.growing_topics,
        declining_topics: analysis.drift_indicators.declining_topics
      }
    };
    rules.push(rule);
  }
  
  // Add drift-based prioritization
  const growingTopics = analysis.drift_indicators.growing_topics;
  if (growingTopics.length > 0) {
    const rule: AdaptationRule = {
      id: `scrum-prio-drift-${Date.now()}`,
      type: "scrum_prioritization",
      condition: `Growing topics detected: ${growingTopics.map(t => t.topic).join(', ')}`,
      action: `Prioritize SCUM items related to emerging/growing topics`,
      priority: Math.floor(growingTopics.reduce((sum, t) => sum + t.growth_rate, 0) / growingTopics.length * 5),
      ttl: 3 * 60 * 60 * 1000, // 3 hours
      metadata: {
        growing_topics: growingTopics,
        prioritization_focus: "emerging_topics"
      }
    };
    rules.push(rule);
  }
  
  return rules;
}

// Evaluate memory settings adaptations based on outcome patterns
function evaluateMemoryAdaptations(
  analysis: any,
  residues: any[],
  promotions: any[]
): AdaptationRule[] {
  const rules: AdaptationRule[] = [];
  
  // Look for memory strengthening promotions
  const memoryPromotions = promotions.filter((p: any) => p.promotion_type === "memory_strengthen");
  
  memoryPromotions.forEach((promo: any) => {
    if (promo.metadata) {
      const rule: AdaptationRule = {
        id: `memory-strength-${Date.now()}`,
        type: "memory_decay",
        condition: `Successful outcomes suggest pattern reinforcement`,
        action: `Reduce memory decay for patterns related to ${promo.metadata.applicable_contexts.join(' or ')}`,
        priority: Math.floor(promo.metadata.success_metrics.usefulness * 10),
        ttl: undefined, // Permanent until overridden
        metadata: {
          usefulness: promo.metadata.success_metrics.usefulness,
          time_efficiency: promo.metadata.success_metrics.time_efficiency,
          quality: promo.metadata.success_metrics.quality,
          decay_resistance: promo.metadata.decay_resistance,
          applicable_contexts: promo.metadata.applicable_contexts
        }
      };
      rules.push(rule);
    }
  });
  
  // Add ongoing memory settings based on outcome analysis
  const outcomeResidues = residues.filter(r => r.trace_type === "outcome_residue") as any[];
  if (outcomeResidues.length >= 3) {
    const successfulOutcomes = outcomeResidues.filter(o => 
      o.outcome_type === 'completed' || 
      (o.success_metrics && o.success_metrics.usefulness_score > 0.6)
    );
    
    const successRate = successfulOutcomes.length / outcomeResidues.length;
    
    if (successRate > 0.6) { // Good success rate - reinforce learning
      const rule: AdaptationRule = {
        id: `memory-learn-rate-${Date.now()}`,
        type: "memory_decay",
        condition: `High outcome success rate (${(successRate * 100).toFixed(0)}%)`,
        action: `Increase learning rate and decrease memory decay for successful patterns`,
        priority: Math.floor(successRate * 8),
        ttl: 6 * 60 * 60 * 1000, // 6 hours
        metadata: {
          success_rate: successRate,
          learning_rate_multiplier: 1 + successRate,
          decay_resistance: 0.5 + successRate * 0.4
        }
      };
      rules.push(rule);
    } else if (successRate < 0.3) { // Poor success rate - question assumptions
      const rule: AdaptationRule = {
        id: `memory-question-${Date.now()}`,
        type: "memory_decay",
        condition: `Low outcome success rate (${(successRate * 100).toFixed(0)}%)`,
        action: `Decrease learning rate and increase skepticism - question recent assumptions`,
        priority: Math.floor((1 - successRate) * 8),
        ttl: 4 * 60 * 60 * 1000, // 4 hours
        metadata: {
          success_rate: successRate,
          learning_rate_multiplier: Math.max(0.5, 1 - (1 - successRate) * 0.5),
          decay_resistance: Math.max(0.2, 0.5 - (1 - successRate) * 0.3)
        }
      };
      rules.push(rule);
    }
  }
  
  return rules;
}

// Get currently active adaptations (non-expired)
export function getActiveAdaptations(): AppliedAdaptations {
  const adaptations = evaluateAdaptations();
  const now = Date.now();
  
  // Filter out expired adaptations
  const filterAdaptations = (rules: AdaptationRule[]): AdaptationRule[] => {
    return rules.filter(rule => 
      !rule.ttl || (rule.metadata && rule.metadata._applied_at && now - rule.metadata._applied_at < rule.ttl)
    );
  };
  
  return {
    routing_rules: filterAdaptations(adaptations.routing_rules),
    delegation_preferences: filterAdaptations(adaptations.delegation_preferences),
    ui_emphasis: filterAdaptations(adaptations.ui_emphasis),
    scrum_prioritization: filterAdaptations(adaptations.scrum_prioritization),
    memory_settings: filterAdaptations(adaptations.memory_settings)
  };
}

// Apply adaptations (would typically update office configuration/state)
export function applyAdaptations(adaptations: AppliedAdaptations): void {
  const now = Date.now();
  
  // Mark all adaptations with application time
  const markApplied = (rules: AdaptationRule[]): AdaptationRule[] => {
    return rules.map(rule => ({
      ...rule,
      metadata: {
        ...rule.metadata,
        _applied_at: now
      }
    }));
  };
  
  // In a real implementation, this would update office behavior
  // For now, just log what would be applied
  console.log("[AdaptationSystem] Applying routing adaptations:", 
    markApplied(adaptations.routing_rules).map(r => r.action));
  console.log("[AdaptationSystem] Applying delegation adaptations:", 
    markApplied(adaptations.delegation_preferences).map(r => r.action));
  console.log("[AdaptationSystem] Applying UI emphasis adaptations:", 
    markApplied(adaptations.ui_emphasis).map(r => r.action));
  console.log("[AdaptationSystem] Applying SCRUM prioritization adaptations:", 
    markApplied(adaptations.scrum_prioritization).map(r => r.action));
  console.log("[AdaptationSystem] Applying memory adaptations:", 
    markApplied(adaptations.memory_settings).map(r => r.action));
}