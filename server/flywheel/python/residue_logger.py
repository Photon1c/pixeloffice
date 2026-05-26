#!/usr/bin/env python3
"""
Residue Logger for Pixel Office Flywheel
Captures events from cooler sessions, scrum actions, task changes
"""

import json
import os
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Residue storage file
RESIDUES_FILE = (
    "os.getcwd()/data/office_residues.json"
)

# Decay times for different residue types (in seconds)
DECAY_TIMES = {
    "conversation_residue": 60 * 60,  # 1 hour
    "task_residue": 24 * 60 * 60,  # 24 hours
    "delegation_residue": 60 * 60,  # 1 hour
    "spatial_residue": 30 * 60,  # 30 minutes
    "outcome_residue": 24 * 60 * 60,  # 24 hours
}


class ResidueType(Enum):
    CONVERSATION = "conversation_residue"
    TASK = "task_residue"
    DELEGATION = "delegation_residue"
    SPATIAL = "spatial_residue"
    OUTCOME = "outcome_residue"


@dataclass
class ConversationResidue:
    id: str
    trace_type: str
    source_session_id: str
    topic: str
    location: str
    participants: List[str]
    keywords: List[str]
    signals: Dict[str, float]
    created_at: str
    expires_at: str


@dataclass
class TaskResidue:
    id: str
    trace_type: str
    source_session_id: str
    task_id: str
    title: str
    status: str
    created_at: str
    updated_at: str
    expires_at: str
    outcome: Dict[str, Any]
    related_conversations: List[str]


@dataclass
class DelegationResidue:
    id: str
    trace_type: str
    source_session_id: str
    delegator: str
    delegatee: str
    request_type: str
    success_indicators: Dict[str, Any]
    created_at: str
    expires_at: str


@dataclass
class SpatialResidue:
    id: str
    trace_type: str
    location: str
    event_type: str
    topic: str
    participants: List[str]
    intensity: float  # 0-1
    created_at: str
    expires_at: str
    metadata: Dict[str, Any]


@dataclass
class OutcomeResidue:
    id: str
    trace_type: str
    source_session_id: str
    task_id: str
    outcome_type: str
    success_metrics: Dict[str, Any]
    created_at: str
    expires_at: str


# Union type for all residues
OfficeResidue = (
    ConversationResidue
    | TaskResidue
    | DelegationResidue
    | SpatialResidue
    | OutcomeResidue
)


def ensure_data_dir():
    """Ensure the data directory exists"""
    os.makedirs(os.path.dirname(RESIDUES_FILE), exist_ok=True)


def get_active_residues() -> List[OfficeResidue]:
    """Get all active (non-expired) residues"""
    if not os.path.exists(RESIDUES_FILE):
        return []

    try:
        with open(RESIDUES_FILE, "r") as f:
            all_residues = json.load(f)

        now = datetime.now().isoformat()
        active_residues = []

        for residue_dict in all_residues:
            # Check if residue has expires_at and if it's still valid
            if "expires_at" not in residue_dict or residue_dict["expires_at"] > now:
                # Convert back to appropriate residue type
                residue_type = residue_dict.get("trace_type")
                if residue_type == ResidueType.CONVERSATION.value:
                    active_residues.append(ConversationResidue(**residue_dict))
                elif residue_type == ResidueType.TASK.value:
                    active_residues.append(TaskResidue(**residue_dict))
                elif residue_type == ResidueType.DELEGATION.value:
                    active_residues.append(DelegationResidue(**residue_dict))
                elif residue_type == ResidueType.SPATIAL.value:
                    active_residues.append(SpatialResidue(**residue_dict))
                elif residue_type == ResidueType.OUTCOME.value:
                    active_residues.append(OutcomeResidue(**residue_dict))

        return active_residues
    except Exception as e:
        print(f"[ResidueLogger] Error reading residues: {e}")
        return []


def save_residues(residues: List[OfficeResidue]):
    """Save residues to file"""
    ensure_data_dir()
    # Convert dataclasses to dicts for JSON serialization
    residues_dicts = [asdict(residue) for residue in residues]
    with open(RESIDUES_FILE, "w") as f:
        json.dump(residues_dicts, f, indent=2)


def deposit_conversation_residue(
    session_id: str, topic: str, participants: List[str], location: str, content: str
) -> ConversationResidue:
    """Deposit conversation residue from cooler session"""
    # Calculate signals based on content analysis
    signals = calculate_conversation_signals(content)

    now = datetime.now()
    expires = now + timedelta(seconds=DECAY_TIMES["conversation_residue"])

    residue = ConversationResidue(
        id=f"conv-res-{int(time.time())}-{str(uuid.uuid4())[:8]}",
        trace_type=ResidueType.CONVERSATION.value,
        source_session_id=session_id,
        topic=topic,
        location=location,
        participants=participants,
        keywords=extract_keywords(content),
        signals=signals,
        created_at=now.isoformat(),
        expires_at=expires.isoformat(),
    )

    active = get_active_residues()
    active.append(residue)
    save_residues(active)

    print(
        f"[ResidueLogger] Deposited conversation residue: {topic} ({signals['actionability']:.2f} actionability)"
    )
    return residue


def deposit_task_residue(
    session_id: str, task_id: str, title: str, status: str
) -> TaskResidue:
    """Deposit task residue when task is created/updated"""
    now = datetime.now()
    expires = now + timedelta(seconds=DECAY_TIMES["task_residue"])

    residue = TaskResidue(
        id=f"task-res-{int(time.time())}-{str(uuid.uuid4())[:8]}",
        trace_type=ResidueType.TASK.value,
        source_session_id=session_id,
        task_id=task_id,
        title=title,
        status=status,
        created_at=now.isoformat(),
        updated_at=now.isoformat(),
        expires_at=expires.isoformat(),
        outcome={
            "human_approved": False,
            "artifact_created": False,
            "dead_end": False,
            "repeated_issue_solved": False,
            "spawned_followup_tasks": 0,
        },
        related_conversations=[session_id],
    )

    active = get_active_residues()
    active.append(residue)
    save_residues(active)

    print(f"[ResidueLogger] Deposited task residue: {title} ({status})")
    return residue


def update_task_residue(task_id: str, updates: Dict[str, Any]):
    """Update task residue when task status changes"""
    active = get_active_residues()
    task_index = None

    for i, residue in enumerate(active):
        if (
            hasattr(residue, "trace_type")
            and residue.trace_type == ResidueType.TASK.value
            and hasattr(residue, "task_id")
            and residue.task_id == task_id
        ):
            task_index = i
            break

    if task_index is not None:
        # Update the task residue
        residue_dict = asdict(active[task_index])
        residue_dict.update(updates)
        residue_dict["updated_at"] = datetime.now().isoformat()
        active[task_index] = TaskResidue(**residue_dict)
        save_residues(active)
        print(f"[ResidueLogger] Updated task residue: {task_id}")


def deposit_delegation_residue(
    session_id: str, delegator: str, delegatee: str, request_type: str
) -> DelegationResidue:
    """Deposit delegation residue when someone asks for help"""
    now = datetime.now()
    expires = now + timedelta(seconds=DECAY_TIMES["delegation_residue"])

    residue = DelegationResidue(
        id=f"del-res-{int(time.time())}-{str(uuid.uuid4())[:8]}",
        trace_type=ResidueType.DELEGATION.value,
        source_session_id=session_id,
        delegator=delegator,
        delegatee=delegatee,
        request_type=request_type,
        success_indicators={
            "useful_artifact_created": False,
            "followup_requests": 0,
            "escalation_rate": 0.0,
            "solution_quality": 0.5,
        },
        created_at=now.isoformat(),
        expires_at=expires.isoformat(),
    )

    active = get_active_residues()
    active.append(residue)
    save_residues(active)

    print(
        f"[ResidueLogger] Deposited delegation residue: {delegator} -> {delegatee} ({request_type})"
    )
    return residue


def deposit_spatial_residue(
    location: str,
    event_type: str,
    topic: str,
    participants: List[str],
    intensity: float,
) -> SpatialResidue:
    """Deposit spatial residue for location-based events"""
    # Clamp intensity between 0 and 1
    intensity = max(0.0, min(1.0, intensity))

    now = datetime.now()
    expires = now + timedelta(seconds=DECAY_TIMES["spatial_residue"])

    residue = SpatialResidue(
        id=f"spat-res-{int(time.time())}-{str(uuid.uuid4())[:8]}",
        trace_type=ResidueType.SPATIAL.value,
        location=location,
        event_type=event_type,
        topic=topic,
        participants=participants,
        intensity=intensity,
        created_at=now.isoformat(),
        expires_at=expires.isoformat(),
        metadata={
            "idea_survival_rate": 0.5,  # default - will be updated by learning system
            "blockage_frequency": 0.3,  # default
            "decision_latency": 15,  # minutes default
        },
    )

    active = get_active_residues()
    active.append(residue)
    save_residues(active)

    print(
        f"[ResidueLogger] Deposited spatial residue: {location} {event_type} ({intensity:.2f} intensity)"
    )
    return residue


def deposit_outcome_residue(
    session_id: str, task_id: str, outcome_type: str, success_metrics: Dict[str, Any]
) -> OutcomeResidue:
    """Deposit outcome residue when task completes or fails"""
    now = datetime.now()
    expires = now + timedelta(seconds=DECAY_TIMES["outcome_residue"])

    residue = OutcomeResidue(
        id=f"out-res-{int(time.time())}-{str(uuid.uuid4())[:8]}",
        trace_type=ResidueType.OUTCOME.value,
        source_session_id=session_id,
        task_id=task_id,
        outcome_type=outcome_type,
        success_metrics=success_metrics,
        created_at=now.isoformat(),
        expires_at=expires.isoformat(),
    )

    active = get_active_residues()
    active.append(residue)
    save_residues(active)

    print(
        f"[ResidueLogger] Deposited outcome residue: {task_id} -> {outcome_type} ({success_metrics.get('usefulness_score', 0):.2f} usefulness)"
    )
    return residue


def calculate_conversation_signals(content: str) -> Dict[str, float]:
    """Calculate conversation signals from content"""
    content_lower = content.lower()

    # Novelty - based on uncommon words/topics
    novelty_words = [
        "innovative",
        "breakthrough",
        "novel",
        "new approach",
        "experiment",
    ]
    novelty_score = sum(0.2 for word in novelty_words if word in content_lower)
    novelty_score = min(1.0, novelty_score)

    # Agreement - based on agreement language
    agreement_words = ["agree", "yes", "exactly", "absolutely", "correct", "right"]
    agreement_score = sum(0.15 for word in agreement_words if word in content_lower)
    agreement_score = min(1.0, agreement_score)

    # Actionability - based on action phrases
    action_words = [
        "should",
        "need to",
        "have to",
        "must",
        "let's",
        "we will",
        "going to",
    ]
    action_score = sum(0.2 for word in action_words if word in content_lower)
    action_score = min(1.0, action_score)

    # Recurrence - placeholder (would need historical data)
    recurrence_score = 0.5

    # Urgency - based on urgency indicators
    urgency_words = [
        "urgent",
        "asap",
        "immediately",
        "deadline",
        "critical",
        "emergency",
    ]
    urgency_score = sum(0.2 for word in urgency_words if word in content_lower)
    urgency_score = min(1.0, urgency_score)

    # Emotional intensity - based on emotional language and punctuation
    emotional_words = [
        "amazing",
        "terrible",
        "great",
        "awful",
        "love",
        "hate",
        "excited",
        "frustrated",
    ]
    emotional_score = sum(0.15 for word in emotional_words if word in content_lower)
    # Boost for exclamation marks and caps
    exclamation_count = content.count("!")
    caps_ratio = sum(1 for c in content if c.isupper()) / max(1, len(content))
    emotional_score += min(0.3, exclamation_count * 0.1 + caps_ratio)
    emotional_score = min(1.0, emotional_score)

    return {
        "novelty": novelty_score,
        "agreement": agreement_score,
        "actionability": action_score,
        "recurrence": recurrence_score,
        "urgency": urgency_score,
        "emotional_intensity": emotional_score,
    }


def extract_keywords(content: str) -> List[str]:
    """Extract keywords from content"""
    # Simple keyword extraction - in practice would use NLP
    words = content.lower()
    # Remove non-alphabetic characters and split
    words = "".join(c if c.isalpha() or c.isspace() else " " for c in words)
    words = words.split()

    # Filter out common words and short words
    stop_words = {
        "the",
        "and",
        "for",
        "are",
        "but",
        "not",
        "you",
        "all",
        "can",
        "had",
        "her",
        "was",
        "one",
        "our",
        "out",
        "day",
        "get",
        "has",
        "him",
        "his",
        "how",
        "its",
        "may",
        "new",
        "now",
        "old",
        "see",
        "two",
        "who",
        "boy",
        "did",
        "man",
        "men",
        "put",
        "too",
        "any",
    }
    words = [w for w in words if len(w) > 3 and w not in stop_words]

    # Return unique keywords, max 10
    return list(dict.fromkeys(words))[:10]  # Preserves order and removes duplicates


def get_residues_by_type(residue_type: ResidueType) -> List[OfficeResidue]:
    """Get residues by type"""
    active = get_active_residues()
    return [
        r
        for r in active
        if hasattr(r, "trace_type") and r.trace_type == residue_type.value
    ]


def get_residues_by_session(session_id: str) -> List[OfficeResidue]:
    """Get residues by source session"""
    active = get_active_residues()
    return [
        r
        for r in active
        if hasattr(r, "source_session_id") and r.source_session_id == session_id
    ]


def cleanup_expired_residues() -> int:
    """Clear expired residues (maintenance function)"""
    active = get_active_residues()
    now = datetime.now().isoformat()
    valid = []

    for residue in active:
        if hasattr(residue, "expires_at"):
            if residue.expires_at > now:
                valid.append(residue)
        else:
            # No expiration date, keep it
            valid.append(residue)

    removed = len(active) - len(valid)
    if removed > 0:
        save_residues(valid)
        print(f"[ResidueLogger] Cleaned up {removed} expired residues")

    return removed


if __name__ == "__main__":
    # Test the residue logger
    print("Testing Residue Logger...")

    # Test conversation residue
    conv_res = deposit_conversation_residue(
        session_id="test-session-001",
        topic="Discussing new feature implementation",
        participants=["Alice", "Bob", "Charlie"],
        location="conference_room",
        content="We should implement the new feature ASAP! This is absolutely critical and we need to get it done.",
    )

    # Test task residue
    task_res = deposit_task_residue(
        session_id="test-session-001",
        task_id="task-001",
        title="Implement new feature",
        status="in_progress",
    )

    # Test delegation residue
    del_res = deposit_delegation_residue(
        session_id="test-session-001",
        delegator="Alice",
        delegatee="Bob",
        request_type="code_review",
    )

    # Test spatial residue
    spat_res = deposit_spatial_residue(
        location="kitchen",
        event_type="casual_discussion",
        topic="Weekend plans",
        participants=["Alice", "Bob"],
        intensity=0.3,
    )

    # Test outcome residue
    outcome_res = deposit_outcome_residue(
        session_id="test-session-001",
        task_id="task-001",
        outcome_type="completed",
        success_metrics={
            "usefulness_score": 0.9,
            "time_to_completion": 120,
            "quality_indicators": {"code_quality": 0.8, "test_coverage": 0.9},
        },
    )

    # Show active residues
    active = get_active_residues()
    print(f"\nActive residues: {len(active)}")
    for residue in active:
        if hasattr(residue, "trace_type"):
            print(
                f"  - {residue.trace_type}: {getattr(residue, 'topic', getattr(residue, 'title', 'N/A'))}"
            )

    print("\nResidue Logger test complete!")
