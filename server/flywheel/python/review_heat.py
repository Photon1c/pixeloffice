#!/usr/bin/env python3
"""
Review Heat Engine for Pixel Office Flywheel
Aggregates and scores: recurrence, actionability, novelty, urgency
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

# Import residue logger functions
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from residue_logger import get_active_residues, RESIDUES_FILE, ResidueType

# Review heat storage file
REVIEW_HEAT_FILE = (
    "/home/sherlockhums/apps/pixelworld/pixel_office/data/review_heat.json"
)

# Decay time for review heat (10 minutes for prototype)
DECAY_TIME_MS = 10 * 60 * 1000


@dataclass
class ReviewHeat:
    id: str
    trace_type: str
    source_session_id: str
    intensity: float  # [0, 1]
    topic: str
    anchor: str
    created_at: str
    expires_at: str
    target_ref: Optional[Dict[str, Any]] = None


def ensure_data_dir():
    """Ensure the data directory exists"""
    os.makedirs(os.path.dirname(REVIEW_HEAT_FILE), exist_ok=True)


def get_active_heat() -> List[ReviewHeat]:
    """Get all active (non-expired) review heat"""
    if not os.path.exists(REVIEW_HEAT_FILE):
        return []

    try:
        with open(REVIEW_HEAT_FILE, "r") as f:
            all_heat = json.load(f)

        now = datetime.now().isoformat()
        active = [
            ReviewHeat(**heat) for heat in all_heat if heat.get("expires_at", "") > now
        ]
        return active
    except Exception as e:
        print(f"[ReviewHeat] Error reading heat file: {e}")
        return []


def save_heat(heat: List[ReviewHeat]):
    """Save review heat to file"""
    ensure_data_dir()
    heat_dicts = [h.__dict__ for h in heat]
    with open(REVIEW_HEAT_FILE, "w") as f:
        json.dump(heat_dicts, f, indent=2)


def deposit_review_heat(
    session_id: str, topic: str, content: str, anchor: str = "kitchen"
) -> Optional[ReviewHeat]:
    """Deposit review heat from conversation"""
    keywords = [
        "review",
        "pr",
        "pull request",
        "backlog",
        "blocked",
        "approval",
        "stale",
        "merge",
        "bottleneck",
    ]
    content_lower = content.lower()

    hit_count = sum(1 for k in keywords if k in content_lower)

    if hit_count == 0:
        return None

    intensity = min(1.0, hit_count * 0.2)
    now = datetime.now()
    expires = now + timedelta(milliseconds=DECAY_TIME_MS)

    new_heat = ReviewHeat(
        id=f"heat-{int(now.timestamp() * 1000)}",
        trace_type="review_heat",
        source_session_id=session_id,
        intensity=intensity,
        topic=topic,
        anchor=anchor,
        created_at=now.isoformat(),
        expires_at=expires.isoformat(),
    )

    active = get_active_heat()
    active.append(new_heat)
    save_heat(active)

    print(
        f"[ReviewHeat] Deposited heat for session {session_id}: intensity {intensity:.2f}, topic: {topic}"
    )
    return new_heat


def get_total_heat_intensity() -> float:
    """Get total heat intensity across all active heat"""
    active = get_active_heat()
    if len(active) == 0:
        return 0.0

    total = sum(h.intensity for h in active)
    return min(1.0, total)


# ============ Review Heat Analysis Functions ============


def calculate_review_heat(
    conversation_residues: List[Any], review_heat_traces: List[ReviewHeat]
) -> float:
    """Calculate review heat from conversation residues and existing traces"""
    if not conversation_residues and not review_heat_traces:
        return 0.0

    # Heat from conversation residues
    conv_heat = 0.0
    for residue in conversation_residues:
        if hasattr(residue, "signals") and residue.signals:
            # Boost heat if there's review-related content
            topic_lower = getattr(residue, "topic", "").lower()
            review_boost = (
                0.3
                if any(
                    k in topic_lower
                    for k in [
                        "review",
                        "pr",
                        "pull request",
                        "backlog",
                        "blocked",
                        "approval",
                        "stale",
                        "merge",
                        "bottleneck",
                    ]
                )
                else 0
            )

            actionability = residue.signals.get("actionability", 0.5)
            conv_heat += actionability * 0.4 + review_boost
        else:
            conv_heat += 0.2

    # Heat from existing review heat traces
    trace_heat = sum(t.intensity for t in review_heat_traces)

    # Combine and normalize
    total = conv_heat * 0.6 + trace_heat * 0.4
    total_count = len(conversation_residues) + len(review_heat_traces)
    return min(1.0, total / max(1, total_count) * 3)


def calculate_task_shadow(
    task_residues: List[Any], task_shadow_traces: List[Any]
) -> float:
    """Calculate task shadow from unfinished tasks"""
    if not task_residues and not task_shadow_traces:
        return 0.0

    # Shadow from incomplete tasks
    incomplete_tasks = sum(
        1
        for task in task_residues
        if hasattr(task, "status") and task.status not in ["completed", "died"]
    )

    task_shadow = min(1.0, incomplete_tasks / max(1, len(task_residues)) * 1.5)

    # Shadow from traces
    trace_shadow = sum(t.get("intensity", 0) for t in task_shadow_traces)

    return min(1.0, task_shadow * 0.7 + min(1.0, trace_shadow) * 0.3)


def calculate_escalation_need(
    conversation_residues: List[Any],
    task_residues: List[Any],
    outcome_residues: List[Any],
) -> float:
    """Calculate escalation need from blockers and unresolved issues"""
    if not conversation_residues and not task_residues:
        return 0.0

    # Escalation from conversation
    escalation_words = [
        "block",
        "stall",
        "stuck",
        "waiting",
        "delay",
        "impediment",
        "obstacle",
    ]
    conv_escalation = 0.0
    for residue in conversation_residues:
        if hasattr(residue, "topic"):
            topic_lower = residue.topic.lower()
            score = sum(0.2 for word in escalation_words if word in topic_lower)
            conv_escalation += min(0.5, score)

    if conversation_residues:
        conv_escalation /= len(conversation_residues)

    # Escalation from tasks
    task_escalation = sum(
        0.4 for task in task_residues if getattr(task, "status", "") == "blocked"
    )
    if task_residues:
        task_escalation /= len(task_residues)

    # Escalation from outcomes
    outcome_escalation = 0.0
    for outcome in outcome_residues:
        if hasattr(outcome, "outcome_type"):
            if outcome.outcome_type in ["died", "escalated"]:
                outcome_escalation += 0.3
            if hasattr(outcome, "success_metrics"):
                if outcome.success_metrics.get("usefulness_score", 0.5) < 0.3:
                    outcome_escalation += 0.2

    if outcome_residues:
        outcome_escalation /= len(outcome_residues)

    return min(
        1.0, conv_escalation * 0.4 + task_escalation * 0.4 + outcome_escalation * 0.2
    )


def calculate_topic_persistence(conversation_residues: List[Any]) -> float:
    """Calculate how long topics linger and recur"""
    if len(conversation_residues) < 2:
        return 0.3

    # Group residues by topic
    topic_groups: Dict[str, List[int]] = {}
    for i, residue in enumerate(conversation_residues):
        if hasattr(residue, "topic"):
            # Simple topic key - first significant word
            topic_words = residue.topic.lower().split()
            topic_key = next((w for w in topic_words if len(w) > 3), "general")
            if topic_key not in topic_groups:
                topic_groups[topic_key] = []
            topic_groups[topic_key].append(i)

    # Calculate persistence
    total_persistence = 0.0
    group_count = 0

    for indices in topic_groups.values():
        if len(indices) > 1:
            first_index = min(indices)
            last_index = max(indices)
            persistence = min(
                1.0, (len(indices) - 1) / max(1, last_index - first_index) * 10
            )
            total_persistence += persistence
            group_count += 1

    return total_persistence / group_count if group_count > 0 else 0.3


def calculate_delegation_confidence(
    delegation_residues: List[Any], outcome_residues: List[Any]
) -> Dict[str, float]:
    """Calculate how reliable agents are at different work"""
    confidence: Dict[str, float] = {}

    for residue in delegation_residues:
        if hasattr(residue, "delegatee") and hasattr(residue, "success_indicators"):
            delegatee = residue.delegatee
            if delegatee not in confidence:
                confidence[delegatee] = 0.5

            success = residue.success_indicators
            adjustment = 0.0
            if success.get("useful_artifact_created", False):
                adjustment += 0.2
            if success.get("followup_requests", 0) < 2:
                adjustment += 0.1
            if success.get("escalation_rate", 1) < 0.3:
                adjustment += 0.1
            if success.get("solution_quality", 0.5) > 0.7:
                adjustment += 0.2

            confidence[delegatee] = min(
                1.0, max(0.0, confidence[delegatee] + adjustment)
            )

    return confidence


def calculate_office_mood(
    conversation_residues: List[Any], outcome_residues: List[Any]
) -> Dict[str, float]:
    """Calculate overall office mood"""
    valence = 0.0
    arousal = 0.5
    dominance = 0.5

    if conversation_residues:
        positive_words = [
            "great",
            "excellent",
            "amazing",
            "wonderful",
            "fantastic",
            "success",
            "win",
        ]
        negative_words = [
            "bad",
            "terrible",
            "awful",
            "horrible",
            "failed",
            "problem",
            "issue",
        ]

        for residue in conversation_residues:
            if hasattr(residue, "signals") and hasattr(residue, "topic"):
                emotional_intensity = residue.signals.get("emotional_intensity", 0.5)
                topic_lower = residue.topic.lower()

                sentiment = sum(0.2 for w in positive_words if w in topic_lower) - sum(
                    0.2 for w in negative_words if w in topic_lower
                )

                valence += sentiment * emotional_intensity * 0.3

                urgency = residue.signals.get("urgency", 0.5)
                arousal += (emotional_intensity * 0.4 + urgency * 0.3) * 0.2

                actionability = residue.signals.get("actionability", 0.5)
                agreement = residue.signals.get("agreement", 0.5)
                dominance += (actionability * 0.3 + agreement * 0.2) * 0.2

        count = len(conversation_residues)
        valence = max(-1.0, min(1.0, valence / count))
        arousal = max(0.0, min(1.0, arousal / count))
        dominance = max(0.0, min(1.0, dominance / count))

    # Adjust based on outcomes
    if outcome_residues:
        success_rate = sum(
            1
            for o in outcome_residues
            if getattr(o, "outcome_type", "") == "completed"
            or (
                hasattr(o, "success_metrics")
                and o.success_metrics.get("usefulness_score", 0.5) > 0.6
            )
        ) / len(outcome_residues)

        valence = max(-1.0, min(1.0, valence + (success_rate - 0.5) * 0.4))
        arousal = max(0.0, min(1.0, arousal * (0.5 + success_rate * 0.5)))

    return {"valence": valence, "arousal": arousal, "dominance": dominance}


def calculate_drift_indicators(
    conversation_residues: List[Any],
) -> Dict[str, List[Dict[str, Any]]]:
    """Calculate emerging and declining topics"""
    growing = []
    declining = []

    if len(conversation_residues) >= 3:
        mid = len(conversation_residues) // 2
        older = conversation_residues[:mid]
        recent = conversation_residues[mid:]

        older_topics: Dict[str, int] = {}
        recent_topics: Dict[str, int] = {}

        for r in older:
            if hasattr(r, "topic"):
                topic = r.topic.lower()
                older_topics[topic] = older_topics.get(topic, 0) + 1

        for r in recent:
            if hasattr(r, "topic"):
                topic = r.topic.lower()
                recent_topics[topic] = recent_topics.get(topic, 0) + 1

        all_topics = set(older_topics.keys()) | set(recent_topics.keys())

        for topic in all_topics:
            older_count = older_topics.get(topic, 0)
            recent_count = recent_topics.get(topic, 0)

            if older_count > 0:
                growth_rate = (recent_count - older_count) / older_count

                if growth_rate > 0.3 and recent_count >= 2:
                    growing.append(
                        {"topic": topic, "growth_rate": min(2.0, growth_rate)}
                    )
                elif growth_rate < -0.3 and older_count >= 2:
                    declining.append(
                        {"topic": topic, "decline_rate": min(2.0, abs(growth_rate))}
                    )

        growing.sort(key=lambda x: x["growth_rate"], reverse=True)
        declining.sort(key=lambda x: x["decline_rate"], reverse=True)

    return {"growing_topics": growing[:5], "declining_topics": declining[:5]}


def analyze_office_residues() -> Dict[str, Any]:
    """Main interpretation function - analyzes all residues to produce insights"""
    # Get all active residues by type
    conversation_residues = [
        r
        for r in get_active_residues()
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.CONVERSATION.value
    ]
    task_residues = [
        r
        for r in get_active_residues()
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.TASK.value
    ]
    delegation_residues = [
        r
        for r in get_active_residues()
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.DELEGATION.value
    ]
    spatial_residues = [
        r
        for r in get_active_residues()
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.SPATIAL.value
    ]
    outcome_residues = [
        r
        for r in get_active_residues()
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.OUTCOME.value
    ]

    # Get existing review heat traces
    review_heat_traces = get_active_heat()

    # Calculate all metrics
    review_heat = calculate_review_heat(conversation_residues, review_heat_traces)
    task_shadow = calculate_task_shadow(task_residues, [])
    escalation_need = calculate_escalation_need(
        conversation_residues, task_residues, outcome_residues
    )
    topic_persistence = calculate_topic_persistence(conversation_residues)
    delegation_confidence = calculate_delegation_confidence(
        delegation_residues, outcome_residues
    )
    office_mood = calculate_office_mood(conversation_residues, outcome_residues)
    drift_indicators = calculate_drift_indicators(conversation_residues)

    return {
        "review_heat": review_heat,
        "task_shadow": task_shadow,
        "escalation_need": escalation_need,
        "topic_persistence": topic_persistence,
        "delegation_confidence": delegation_confidence,
        "office_mood": office_mood,
        "drift_indicators": drift_indicators,
    }


if __name__ == "__main__":
    print("Testing Review Heat Engine...")

    # Analyze current office residues
    analysis = analyze_office_residues()

    print("\n=== Office Analysis ===")
    print(f"Review Heat: {analysis['review_heat']:.2f}")
    print(f"Task Shadow: {analysis['task_shadow']:.2f}")
    print(f"Escalation Need: {analysis['escalation_need']:.2f}")
    print(f"Topic Persistence: {analysis['topic_persistence']:.2f}")
    print(f"Delegation Confidence: {analysis['delegation_confidence']}")
    print(f"Office Mood: {analysis['office_mood']}")
    print(f"Growing Topics: {analysis['drift_indicators']['growing_topics']}")
    print(f"Declining Topics: {analysis['drift_indicators']['declining_topics']}")

    # Test depositing some review heat
    print("\n=== Testing Review Heat Deposit ===")
    deposit_review_heat(
        session_id="test-session-001",
        topic="Code Review for PR #42",
        content="We need to get this PR reviewed and merged ASAP! It's been sitting in the backlog for days.",
        anchor="water_cooler",
    )

    print(f"Total Heat Intensity: {get_total_heat_intensity():.2f}")

    print("\nReview Heat Engine test complete!")
