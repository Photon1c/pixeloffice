// Flywheel Residue Types for Pixel Office
// Defines the 5 residue types that form the stigmergic flywheel

export interface ConversationResidue {
  id: string;
  trace_type: "conversation_residue";
  source_session_id: string;
  topic: string;
  location: string; // kitchen, conference_room, front_desk, etc.
  keywords: string[];
  signals: {
    novelty: number;      // [0,1] how new/unexpected the topic is
    agreement: number;    // [0,1] level of consensus/disagreement
    actionability: number; // [0,1] how much it implies next steps
    recurrence: number;   // [0,1] how often this topic comes up
    urgency: number;      // [0,1] time-sensitivity
    emotional_intensity: number; // [0,1] emotional charge
  };
  created_at: string;
  expires_at: string;
}

export interface TaskResidue {
  id: string;
  trace_type: "task_residue";
  source_session_id: string;
  task_id: string; // links to actual task in scrum system
  title: string;
  status: string; // pending, in_progress, completed, blocked, died
  created_at: string;
  updated_at: string;
  expires_at: string;
  outcome: {
    completion_time?: number; // minutes to complete
    human_approved: boolean;
    artifact_created: boolean;
    dead_end: boolean;
    repeated_issue_solved: boolean;
    spawned_followup_tasks: number;
  };
  related_conversations: string[]; // session IDs that led to this task
}

export interface DelegationResidue {
  id: string;
  trace_type: "delegation_residue";
  source_session_id: string;
  delegator: string; // who asked for help
  delegatee: string; // who was asked
  request_type: string; // summarization, archival, knowledge_extraction, etc.
  success_indicators: {
    useful_artifact_created: boolean;
    followup_requests: number;
    escalation_rate: number;
    solution_quality: number; // [0,1] perceived quality
  };
  created_at: string;
  expires_at: string;
}

export interface SpatialResidue {
  id: string;
  trace_type: "spatial_residue";
  location: string; // kitchen, conference_room, front_desk, executive_desk, archive
  event_type: string; // conversation, blockage, ideation, decision, consolidation
  intensity: number; // [0,1] how strong the signal is
  topic: string;
  participants: string[];
  created_at: string;
  expires_at: string;
  metadata: {
    idea_survival_rate: number; // % of ideas from this location that become tasks
    blockage_frequency: number; // how often blockers occur here
    decision_latency: number; // avg time to make decisions here
  };
}

export interface OutcomeResidue {
  id: string;
  trace_type: "outcome_residue";
  source_session_id: string;
  task_id: string; // links to task
  outcome_type: string; // completed, died, branched, escalated, artifact_created
  success_metrics: {
    usefulness_score: number; // [0,1] human-rated usefulness
    time_to_completion: number; // minutes
    quality_indicators: Record<string, any>;
  };
  created_at: string;
  expires_at: string;
}

// Union type for all residue types
export type OfficeResidue = 
  | ConversationResidue
  | TaskResidue
  | DelegationResidue
  | SpatialResidue
  | OutcomeResidue;

// Base interface for common residue properties
export interface BaseResidue {
  id: string;
  trace_type: string;
  source_session_id?: string;
  created_at: string;
  expires_at?: string;
}