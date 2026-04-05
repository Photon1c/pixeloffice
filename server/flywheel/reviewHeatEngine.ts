import { getActiveResidues } from "./residueLogger";
import { getActiveHeat } from "../cooler/reviewHeat";
import { getActiveTraces } from "../cooler/stigmergy";

export interface ReviewHeatAnalysis {
  review_heat: number;           // [0,1] intensity of review-related discussion
  task_shadow: number;           // [0,1] intensity of unfinished work
  escalation_need: number;       // [0,1] need for escalation based on blockers
  topic_persistence: number;     // [0,1] how persistent topics are
  delegation_confidence: Record<string, number>; // agent -> confidence score [0,1]
  office_mood: {                 // overall office sentiment
    valence: number;             // [-1,1] negative to positive
    arousal: number;             // [0,1] calm to excited
    dominance: number;           // [0,1] submissive to dominant
  };
  drift_indicators: {            // emerging trends
    growing_topics: Array<{topic: string; growth_rate: number}>;
    declining_topics: Array<{topic: string; decline_rate: number}>;
  };
}

// Main interpretation function - analyzes all residues to produce insights
export function analyzeOfficeResidues(): ReviewHeatAnalysis {
  // Get all active residues
  const conversationResidues = getActiveResidues().filter(r => r.trace_type === "conversation_residue");
  const taskResidues = getActiveResidues().filter(r => r.trace_type === "task_residue");
  const delegationResidues = getActiveResidues().filter(r => r.trace_type === "delegation_residue");
  const spatialResidues = getActiveResidues().filter(r => r.trace_type === "spatial_residue");
  const outcomeResidues = getActiveResidues().filter(r => r.trace_type === "outcome_residue");
  
  // Get existing stigmergy traces for additional context
  const reviewHeatTraces = getActiveHeat();
  const taskShadowTraces = getActiveTraces().filter(t => t.type === "task_shadow");
  
  // 1. Review Heat Analysis - from conversation residues and existing heat traces
  const reviewHeat = calculateReviewHeat(conversationResidues, reviewHeatTraces);
  
  // 2. Task Shadow Analysis - from task residues and task shadow traces
  const taskShadow = calculateTaskShadow(taskResidues, taskShadowTraces);
  
  // 3. Escalation Need Analysis - from blockers and unresolved issues
  const escalationNeed = calculateEscalationNeed(conversationResidues, taskResidues, outcomeResidues);
  
  // 4. Topic Persistence - how long topics linger and recur
  const topicPersistence = calculateTopicPersistence(conversationResidues);
  
  // 5. Delegation Confidence - how reliable agents are at different types of work
  const delegationConfidence = calculateDelegationConfidence(delegationResidues, outcomeResidues);
  
  // 6. Office Mood - overall emotional tone of the office
  const officeMood = calculateOfficeMood(conversationResidues, outcomeResidues);
  
  // 7. Drift Indicators - emerging trends and declining topics
  const driftIndicators = calculateDriftIndicators(conversationResidues);
  
  return {
    review_heat: reviewHeat,
    task_shadow: taskShadow,
    escalation_need: escalationNeed,
    topic_persistence: topicPersistence,
    delegation_confidence: delegationConfidence,
    office_mood: officeMood,
    drift_indicators: driftIndicators
  };
}

// Calculate review heat from conversation residues and existing traces
function calculateReviewHeat(
  conversationResidues: any[],
  reviewHeatTraces: any[]
): number {
  if (conversationResidues.length === 0 && reviewHeatTraces.length === 0) return 0;
  
  // Heat from conversation residues (review-related discussions)
  const convHeat = conversationResidues.reduce((sum, residue) => {
    if (residue.signals && typeof residue.signals === 'object') {
      // Boost heat if there's review-related content
      const reviewBoost = residue.topic.toLowerCase().includes('review') || 
                         residue.topic.toLowerCase().includes('pr') ||
                         residue.topic.toLowerCase().includes('pull request') ||
                         residue.topic.toLowerCase().includes('backlog') ||
                         residue.topic.toLowerCase().includes('blocked') ||
                         residue.topic.toLowerCase().includes('approval') ||
                         residue.topic.toLowerCase().includes('stale') ||
                         residue.topic.toLowerCase().includes('merge') ||
                         residue.topic.toLowerCase().includes('bottleneck') ? 0.3 : 0;
      
      return sum + (residue.signals.actionability || 0.5) * 0.4 + reviewBoost;
    }
    return sum + 0.2;
  }, 0);
  
  // Heat from existing review heat traces
  const traceHeat = reviewHeatTraces.reduce((sum, trace) => sum + trace.intensity, 0);
  
  // Combine and normalize
  const total = convHeat * 0.6 + traceHeat * 0.4;
  return Math.min(1, total / Math.max(1, conversationResidues.length + reviewHeatTraces.length) * 3);
}

// Calculate task shadow from unfinished tasks
function calculateTaskShadow(
  taskResidues: any[],
  taskShadowTraces: any[]
): number {
  if (taskResidues.length === 0 && taskShadowTraces.length === 0) return 0;
  
  // Shadow from incomplete tasks
  const incompleteTasks = taskResidues.filter(task => 
    task.status && !['completed', 'died'].includes(task.status)
  ).length;
  
  const taskShadow = Math.min(1, incompleteTasks / Math.max(1, taskResidues.length) * 1.5);
  
  // Shadow from existing task shadow traces
  const traceShadow = taskShadowTraces.reduce((sum, trace) => sum + trace.intensity, 0);
  
  // Combine
  return Math.min(1, taskShadow * 0.7 + Math.min(1, traceShadow) * 0.3);
}

// Calculate escalation need from blockers and unresolved issues
function calculateEscalationNeed(
  conversationResidues: any[],
  taskResidues: any[],
  outcomeResidues: any[]
): number {
  if (conversationResidues.length === 0 && taskResidues.length === 0) return 0;
  
  // Escalation from conversation - mentions of blockers, stalls, etc.
  const convEscalation = conversationResidues.reduce((sum, residue) => {
    const topicLower = residue.topic.toLowerCase();
    const escalationWords = ['block', 'stall', 'stuck', 'waiting', 'delay', 'impediment', 'obstacle'];
    let score = 0;
    escalationWords.forEach(word => {
      if (topicLower.includes(word)) score += 0.2;
    });
    return sum + Math.min(0.5, score);
  }, 0) / Math.max(1, conversationResidues.length);
  
  // Escalation from tasks - blocked or long-running tasks
  const taskEscalation = taskResidues.reduce((sum, task) => {
    let score = 0;
    if (task.status === 'blocked') score += 0.4;
    // Tasks that have been open too long (would need timestamps to calculate properly)
    // For now, use outcome data if available
    return sum + score;
  }, 0) / Math.max(1, taskResidues.length);
  
  // Escalation from outcomes - failed or repeated issues
  const outcomeEscalation = outcomeResidues.reduce((sum, outcome) => {
    let score = 0;
    if (outcome.outcome_type === 'died' || outcome.outcome_type === 'escalated') score += 0.3;
    if (outcome.success_metrics && 
        outcome.success_metrics.usefulness_score < 0.3) score += 0.2;
    return sum + score;
  }, 0) / Math.max(1, outcomeResidues.length);
  
  return Math.min(1, (convEscalation * 0.4 + taskEscalation * 0.4 + outcomeEscalation * 0.2));
}

// Calculate topic persistence - how long topics linger and recur
function calculateTopicPersistence(conversationResidues: any[]): number {
  if (conversationResidues.length < 2) return 0.3; // default low persistence
  
  // Group residues by topic similarity (simple approach)
  const topicGroups: Record<string, number[]> = {};
  
  conversationResidues.forEach((residue, index) => {
    // Simple topic matching - in practice would use better NLP
    const topicKey = residue.topic.toLowerCase().split(' ').filter(w => w.length > 3)[0] || 'general';
    if (!topicGroups[topicKey]) topicGroups[topicKey] = [];
    topicGroups[topicKey].push(index);
  });
  
  // Calculate persistence as average recurrence of topics
  let totalPersistence = 0;
  let groupCount = 0;
  
  Object.values(topicGroups).forEach(indices => {
    if (indices.length > 1) {
      // Topic recurred - calculate time span
      const firstIndex = Math.min(...indices);
      const lastIndex = Math.max(...indices);
      // Simple persistence based on recurrence frequency
      const persistence = Math.min(1, (indices.length - 1) / Math.max(1, lastIndex - firstIndex) * 10);
      totalPersistence += persistence;
      groupCount++;
    }
  });
  
  return groupCount > 0 ? Math.min(1, totalPersistence / groupCount) : 0.3;
}

// Calculate delegation confidence - how reliable agents are at different work
function calculateDelegationConfidence(
  delegationResidues: any[],
  outcomeResidues: any[]
): Record<string, number> {
  const confidence: Record<string, number> = {};
  
  // Process delegation residues to build initial confidence
  delegationResidues.forEach(residue => {
    const delegator = residue.delegator;
    const delegatee = residue.delegatee;
    
    // Initialize if not present
    if (!confidence[delegatee]) confidence[delegatee] = 0.5; // start neutral
    
    // Adjust based on delegation success indicators
    const success = residue.success_indicators;
    if (success) {
      let adjustment = 0;
      if (success.useful_artifact_created) adjustment += 0.2;
      if (success.followup_requests < 2) adjustment += 0.1; // few followups = good
      if (success.escalation_rate < 0.3) adjustment += 0.1; // low escalation = good
      if (success.solution_quality > 0.7) adjustment += 0.2;
      
      confidence[delegatee] = Math.min(1, Math.max(0, confidence[delegatee] + adjustment));
    }
  });
  
  // Refine with outcome data - did delegated work actually succeed?
  outcomeResidues.forEach(outcome => {
    // Would need to link outcomes back to delegations - placeholder for now
    // In practice, would trace from outcome -> task -> delegation -> confidence update
  });
  
  return confidence;
}

// Calculate office mood from emotional language and outcomes
function calculateOfficeMood(
  conversationResidues: any[],
  outcomeResidues: any[]
): { valence: number; arousal: number; dominance: number } {
  // Default neutral mood
  let valence = 0; // neutral
  let arousal = 0.5; // moderate arousal
  let dominance = 0.5; // balanced dominance
  
  if (conversationResidues.length > 0) {
    // Analyze conversation emotional content
    conversationResidues.forEach(residue => {
      if (residue.signals && typeof residue.signals === 'object') {
        const emotionalIntensity = residue.signals.emotional_intensity || 0.5;
        
        // Simple sentiment analysis from topic keywords
        const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'success', 'win'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'failed', 'problem', 'issue'];
        
        const topicLower = residue.topic.toLowerCase();
        let sentiment = 0;
        
        positiveWords.forEach(word => {
          if (topicLower.includes(word)) sentiment += 0.2;
        });
        
        negativeWords.forEach(word => {
          if (topicLower.includes(word)) sentiment -= 0.2;
        });
        
        // Update valence with emotional intensity as weight
        valence += sentiment * emotionalIntensity * 0.3;
        
        // Arousal from emotional intensity and urgency
        const urgency = residue.signals.urgency || 0.5;
        arousal += (emotionalIntensity * 0.4 + urgency * 0.3) * 0.2;
        
        // Dominance from actionability and agreement
        const actionability = residue.signals.actionability || 0.5;
        const agreement = residue.signals.agreement || 0.5;
        dominance += (actionability * 0.3 + agreement * 0.2) * 0.2;
      }
    });
    
    // Average the contributions
    valence = Math.max(-1, Math.min(1, valence / conversationResidues.length));
    arousal = Math.max(0, Math.min(1, arousal / conversationResidues.length));
    dominance = Math.max(0, Math.min(1, dominance / conversationResidues.length));
  }
  
  // Adjust based on outcomes - successful outcomes improve mood
  if (outcomeResidues.length > 0) {
    const successRate = outcomeResidues.filter(o => 
      o.outcome_type === 'completed' || 
      (o.success_metrics && o.success_metrics.usefulness_score > 0.6)
    ).length / outcomeResidues.length;
    
    valence = Math.max(-1, Math.min(1, valence + (successRate - 0.5) * 0.4));
    arousal = Math.max(0, Math.min(1, arousal * (0.5 + successRate * 0.5)));
  }
  
  return { valence, arousal, dominance };
}

// Calculate drift indicators - emerging and declining topics
function calculateDriftIndicators(conversationResidues: any[]): {
  growing_topics: Array<{topic: string; growth_rate: number}>;
  declining_topics: Array<{topic: string; decline_rate: number}>;
} {
  // Need historical data for proper trend analysis
  // For now, return placeholder based on recent activity
  
  const growing: Array<{topic: string; growth_rate: number}> = [];
  const declining: Array<{topic: string; decline_rate: number}> = [];
  
  if (conversationResidues.length >= 3) {
    // Split into recent and older halves
    const midPoint = Math.floor(conversationResidues.length / 2);
    const older = conversationResidues.slice(0, midPoint);
    const recent = conversationResidues.slice(midPoint);
    
    // Count topic occurrences in each half
    const olderTopics: Record<string, number> = {};
    const recentTopics: Record<string, number> = {};
    
    older.forEach(residue => {
      const topic = residue.topic.toLowerCase();
      olderTopics[topic] = (olderTopics[topic] || 0) + 1;
    });
    
    recent.forEach(residue => {
      const topic = residue.topic.toLowerCase();
      recentTopics[topic] = (recentTopics[topic] || 0) + 1;
    });
    
    // Calculate growth/decline rates
    const allTopics = [...new Set([...Object.keys(olderTopics), ...Object.keys(recentTopics)])];
    
    allTopics.forEach(topic => {
      const olderCount = olderTopics[topic] || 0;
      const recentCount = recentTopics[topic] || 0;
      const total = olderCount + recentCount;
      
      if (total > 0) {
        const growthRate = (recentCount - olderCount) / Math.max(1, olderCount);
        
        if (growthRate > 0.3 && recentCount >= 2) {
          growing.push({ topic, growth_rate: Math.min(2, growthRate) });
        } else if (growthRate < -0.3 && olderCount >= 2) {
          declining.push({ topic, decline_rate: Math.min(2, Math.abs(growthRate)) });
        }
      }
    });
    
    // Sort by strength and limit results
    growing.sort((a, b) => b.growth_rate - a.growth_rate);
    declining.sort((a, b) => b.decline_rate - a.decline_rate);
    
    return {
      growing_topics: growing.slice(0, 5),
      declining_topics: declining.slice(0, 5)
    };
  }
  
  return { growing_topics: [], declining_topics: [] };
}