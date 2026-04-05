#!/usr/bin/env python3
"""
Promotion Engine for Pixel Office Flywheel
Turns high-scoring residue into: SCRUM items, follow-up prompts, agent recommendations
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from residue_logger import get_active_residues, ResidueType
from review_heat import analyze_office_residues, get_active_heat


@dataclass
class PromotionResult:
    promoted: bool
    promotion_type: (
        str  # "scrum_seed", "policy", "sop", "routing_rule", "memory_strengthen"
    )
    title: str
    description: str
    rationale: str
    source_residues: List[str]
    metadata: Optional[Dict[str, Any]] = None


class PromotionThresholds:
    REVIEW_HEAT_TO_SCRUM = 0.7
    TASK_SHADOW_TO_POLICY = 0.6
    DELEGATION_TO_SOP = 0.8
    SPATIAL_TO_ROUTING = 0.7
    OUTCOME_TO_MEMORY = 0.75


def determine_recommended_owner(
    residues: List[Any], delegation_confidence: Dict[str, float]
) -> str:
    """Determine recommended owner based on delegation confidence"""
    if not delegation_confidence:
        return "OpenClaw"

    agent_mentions: Dict[str, int] = {}

    for residue in residues:
        if hasattr(residue, "participants") and residue.participants:
            for agent in residue.participants:
                agent_mentions[agent] = agent_mentions.get(agent, 0) + 1
        if hasattr(residue, "delegator") and residue.delegator:
            agent_mentions[residue.delegator] = (
                agent_mentions.get(residue.delegator, 0) + 1
            )
        if hasattr(residue, "delegatee") and residue.delegatee:
            agent_mentions[residue.delegatee] = (
                agent_mentions.get(residue.delegatee, 0) + 1
            )

    best_agent = "OpenClaw"
    best_score = 0

    for agent, mentions in agent_mentions.items():
        confidence = delegation_confidence.get(agent, 0.5)
        score = mentions * (0.5 + confidence * 0.5)
        if score > best_score:
            best_score = score
            best_agent = agent

    return best_agent


def get_common_task_characteristics(tasks: List[Any]) -> str:
    """Get common characteristics from tasks"""
    if not tasks:
        return "no common characteristics identified"

    statuses = list(set(t.status for t in tasks if hasattr(t, "status")))
    outcome_patterns = set()
    for task in tasks:
        if hasattr(task, "outcome"):
            if task.outcome.get("dead_end"):
                outcome_patterns.add("dead_end")
            if task.outcome.get("spawned_followup_tasks", 0) > 2:
                outcome_patterns.add("followup_heavy")

    desc = ""
    if len(statuses) == 1:
        desc += f"All tasks are {statuses[0]}. "
    if outcome_patterns and len(outcome_patterns) == 1:
        desc += f"All show {list(outcome_patterns)[0]} pattern. "

    completion_times = [
        t.outcome.get("completion_time", 0)
        for t in tasks
        if hasattr(t, "outcome") and "completion_time" in t.outcome
    ]
    if len(completion_times) >= 2:
        avg_time = sum(completion_times) / len(completion_times)
        desc += f"Average completion time: {round(avg_time)} minutes. "

    return desc.strip() or "varied characteristics requiring standardization"


def calculate_delegation_success_rate(delegations: List[Any]) -> float:
    """Calculate delegation success rate"""
    if not delegations:
        return 0.5

    success_score = 0.0
    for d in delegations:
        if hasattr(d, "success_indicators"):
            indicators = d.success_indicators
            deleg_success = 0.5

            if indicators.get("useful_artifact_created", False):
                deleg_success += 0.2
            if indicators.get("followup_requests", 0) < 2:
                deleg_success += 0.15
            if indicators.get("escalation_rate", 1) < 0.3:
                deleg_success += 0.15
            if indicators.get("solution_quality", 0.5) > 0.7:
                deleg_success += 0.2

            success_score += min(1.0, deleg_success)

    return success_score / len(delegations)


def extract_common_contexts(outcomes: List[Any]) -> List[str]:
    """Extract common contexts from successful outcomes"""
    if not outcomes:
        return ["general"]

    sessions = list(set(getattr(o, "source_session_id", "general") for o in outcomes))
    return sessions if sessions else ["general"]


def promote_review_heat_to_scrum(
    analysis: Dict[str, Any], residues: List[Any]
) -> Optional[PromotionResult]:
    """Promote review heat to SCRUM seed"""
    review_related = [
        r
        for r in residues
        if hasattr(r, "topic")
        and any(
            k in r.topic.lower()
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
    ]

    if not review_related:
        return None

    # Find most actionable
    most_actionable = max(
        review_related,
        key=lambda r: r.signals.get("actionability", 0) if hasattr(r, "signals") else 0,
    )
    topic = getattr(most_actionable, "topic", "Unknown")

    actionability = (
        most_actionable.signals.get("actionability", 0)
        if hasattr(most_actionable, "signals")
        else 0
    )

    title = f"SCRUM: Review Improvement - {topic}"
    description = f"Address review bottlenecks identified in office conversations. Topics: {', '.join(r.topic for r in review_related)}. Actionability score: {actionability:.2f}."

    rationale = f"Review heat level ({analysis['review_heat']:.2f}) exceeds threshold ({PromotionThresholds.REVIEW_HEAT_TO_SCRUM}). Multiple review-related conversations detected with high actionability."

    return PromotionResult(
        promoted=True,
        promotion_type="scrum_seed",
        title=title,
        description=description,
        rationale=rationale,
        source_residues=[r.id for r in review_related],
        metadata={
            "review_heat_level": analysis["review_heat"],
            "suggested_action": "create_scrum",
            "originating_sessions": list(
                set(
                    r.source_session_id
                    for r in review_related
                    if hasattr(r, "source_session_id")
                )
            ),
            "recommended_owner": determine_recommended_owner(
                review_related, analysis["delegation_confidence"]
            ),
            "related_topics": [r.topic for r in review_related],
        },
    )


def promote_task_shadow_to_policy(
    analysis: Dict[str, Any], residues: List[Any]
) -> Optional[PromotionResult]:
    """Promote task shadow to policy"""
    task_residues = [
        r
        for r in residues
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.TASK.value
    ]
    problematic = [
        t
        for t in task_residues
        if getattr(t, "status", "") in ["blocked", "died"]
        or (
            hasattr(t, "outcome")
            and (
                t.outcome.get("dead_end")
                or t.outcome.get("spawned_followup_tasks", 0) > 2
            )
        )
    ]

    if len(problematic) < 2:
        return None

    # Group by issue type
    issue_groups: Dict[str, List[Any]] = {}
    for task in problematic:
        status = getattr(task, "status", "other")
        if hasattr(task, "outcome"):
            if task.outcome.get("dead_end"):
                status = "dead_end"
            elif task.outcome.get("spawned_followup_tasks", 0) > 2:
                status = "followup_heavy"

        if status not in issue_groups:
            issue_groups[status] = []
        issue_groups[status].append(task)

    # Find most common
    most_common = max(issue_groups.items(), key=lambda x: len(x[1]))
    if len(most_common[1]) < 2:
        return None

    tasks_for_policy = most_common[1]
    most_common_issue = most_common[0]

    title = f"POLICY: Task Management Improvement - {most_common_issue}"
    description = f"Establish clear guidelines for handling {most_common_issue} tasks. Based on {len(tasks_for_policy)} observed instances. Common characteristics: {get_common_task_characteristics(tasks_for_policy)}."

    rationale = f"Task shadow level ({analysis['task_shadow']:.2f}) exceeds threshold ({PromotionThresholds.TASK_SHADOW_TO_POLICY}). {len(tasks_for_policy)} tasks show similar problematic patterns requiring policy intervention."

    return PromotionResult(
        promoted=True,
        promotion_type="policy",
        title=title,
        description=description,
        rationale=rationale,
        source_residues=[t.id for t in tasks_for_policy],
        metadata={
            "task_shadow_level": analysis["task_shadow"],
            "policy_type": most_common_issue,
            "affected_task_count": len(tasks_for_policy),
            "enforcement_suggested": "warning_then_escalation",
            "review_period": "weekly",
        },
    )


def promote_delegation_to_sop(
    analysis: Dict[str, Any], residues: List[Any]
) -> Optional[PromotionResult]:
    """Promote delegation patterns to SOP"""
    delegation_residues = [
        r
        for r in residues
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.DELEGATION.value
    ]

    if len(delegation_residues) < 3:
        return None

    delegation_confidence = analysis.get("delegation_confidence", {})
    trusted_agents = [
        agent for agent, conf in delegation_confidence.items() if conf >= 0.7
    ]

    if not trusted_agents:
        return None

    trusted_delegations = [
        d
        for d in delegation_residues
        if getattr(d, "delegatee", "") in trusted_agents
        or getattr(d, "delegator", "") in trusted_agents
    ]

    if len(trusted_delegations) < 2:
        return None

    # Find most common delegation type
    delegation_types: Dict[str, int] = {}
    for d in trusted_delegations:
        request_type = getattr(d, "request_type", "general_help")
        delegation_types[request_type] = delegation_types.get(request_type, 0) + 1

    most_common_type = (
        max(delegation_types.items(), key=lambda x: x[1])[0]
        if delegation_types
        else "general_help"
    )
    examples = [
        d
        for d in trusted_delegations
        if getattr(d, "request_type", "") == most_common_type
    ]

    avg_confidence = (
        sum(delegation_confidence.values()) / len(delegation_confidence)
        if delegation_confidence
        else 0.5
    )

    title = f"SOP: Delegation Protocol - {most_common_type}"
    description = f"Standard operating procedure for {most_common_type} requests. Based on observation of {len(examples)} successful delegations. Trusted agents: {', '.join(trusted_agents)}."

    rationale = f"Delegation confidence average ({avg_confidence:.2f}) exceeds threshold ({PromotionThresholds.DELEGATION_TO_SOP}). Trusted agents consistently handle {most_common_type} requests effectively."

    return PromotionResult(
        promoted=True,
        promotion_type="sop",
        title=title,
        description=description,
        rationale=rationale,
        source_residues=[e.id for e in examples],
        metadata={
            "delegation_confidence": avg_confidence,
            "trusted_agents": trusted_agents,
            "sop_type": most_common_type,
            "success_rate": calculate_delegation_success_rate(examples),
            "review_triggers": ["new_agent_onboarding", "process_change"],
        },
    )


def promote_spatial_to_routing(
    spatial_residues: List[Any], analysis: Dict[str, Any]
) -> Optional[PromotionResult]:
    """Promote spatial patterns to routing rules"""
    if not spatial_residues:
        return None

    # Group by location
    location_groups: Dict[str, List[Any]] = {}
    for residue in spatial_residues:
        location = getattr(residue, "location", "unknown")
        if location not in location_groups:
            location_groups[location] = []
        location_groups[location].append(residue)

    # Find candidates
    routing_candidates = []
    for location, residues in location_groups.items():
        avg_intensity = sum(r.intensity for r in residues) / len(residues)
        event_types = list(set(getattr(r, "event_type", "unknown") for r in residues))
        frequency = len(residues)

        if avg_intensity >= 0.6 and frequency >= 2:
            routing_candidates.append(
                {
                    "location": location,
                    "avg_intensity": avg_intensity,
                    "event_types": event_types,
                    "frequency": frequency,
                }
            )

    if not routing_candidates:
        return None

    # Best candidate
    best = max(routing_candidates, key=lambda x: x["avg_intensity"] * x["frequency"])

    title = f"ROUTING RULE: Optimize {best['location']} for {' & '.join(best['event_types'])}"
    description = f"Route {' or '.join(best['event_types'])} activities to {best['location']} based on observed patterns. Average intensity: {best['avg_intensity']:.2f} over {best['frequency']} observations."

    rationale = f"Spatial residue intensity ({best['avg_intensity']:.2f}) exceeds threshold ({PromotionThresholds.SPATIAL_TO_ROUTING}) with recurring patterns ({best['frequency']} instances). Clear behavioral pattern detected for {best['location']}."

    return PromotionResult(
        promoted=True,
        promotion_type="routing_rule",
        title=title,
        description=description,
        rationale=rationale,
        source_residues=[r.id for r in spatial_residues],
        metadata={
            "location": best["location"],
            "event_types": best["event_types"],
            "strength": best["avg_intensity"],
            "frequency": best["frequency"],
            "suggested_routing_adjustment": min(0.3, (best["avg_intensity"] - 0.5) * 2),
            "time_window": "ongoing",
            "applies_to_agents": "all",
        },
    )


def promote_outcome_to_memory(
    successful_outcomes: List[Any], analysis: Dict[str, Any]
) -> Optional[PromotionResult]:
    """Promote outcomes to memory strengthening"""
    if len(successful_outcomes) < 3:
        return None

    success_factors = {"usefulness": 0, "time_efficiency": 0, "quality": 0}

    for outcome in successful_outcomes:
        if hasattr(outcome, "success_metrics"):
            metrics = outcome.success_metrics
            success_factors["usefulness"] += metrics.get("usefulness_score", 0.5)

            if "time_to_completion" in metrics:
                time_factor = max(0, 1 - (metrics["time_to_completion"] / 120))
                success_factors["time_efficiency"] += time_factor
            else:
                success_factors["time_efficiency"] += 0.5

            quality_values = [
                v
                for v in metrics.get("quality_indicators", {}).values()
                if isinstance(v, (int, float))
            ]
            if quality_values:
                success_factors["quality"] += sum(quality_values) / len(quality_values)
            else:
                success_factors["quality"] += 0.5

    count = len(successful_outcomes)
    avg_usefulness = success_factors["usefulness"] / count
    avg_time_efficiency = success_factors["time_efficiency"] / count
    avg_quality = success_factors["quality"] / count

    title = "MEMORY STRENGTHEN: Successful Pattern Reinforcement"
    description = f"Reinforce successful office patterns based on {count} successful outcomes. Average usefulness: {avg_usefulness:.2f}, Time efficiency: {avg_time_efficiency:.2f}, Quality: {avg_quality:.2f}."

    rationale = f"Outcome success rate indicates learnable patterns. {count} successful outcomes exceeded threshold ({PromotionThresholds.OUTCOME_TO_MEMORY}). Office should strengthen memory of these effective approaches."

    return PromotionResult(
        promoted=True,
        promotion_type="memory_strengthen",
        title=title,
        description=description,
        rationale=rationale,
        source_residues=[o.id for o in successful_outcomes],
        metadata={
            "outcome_count": count,
            "success_metrics": {
                "usefulness": avg_usefulness,
                "time_efficiency": avg_time_efficiency,
                "quality": avg_quality,
            },
            "reinforcement_type": "pattern_matching",
            "decay_resistance": min(0.9, avg_usefulness * 0.8 + 0.1),
            "applicable_contexts": extract_common_contexts(successful_outcomes),
        },
    )


def evaluate_promotions() -> List[PromotionResult]:
    """Main promotion function - evaluates residues and promotes when thresholds crossed"""
    promotions: List[PromotionResult] = []

    # Get current office analysis and residues
    analysis = analyze_office_residues()
    residues = get_active_residues()

    # 1. Check if review heat should promote to SCRUM seed
    if analysis["review_heat"] >= PromotionThresholds.REVIEW_HEAT_TO_SCRUM:
        scrum_promotion = promote_review_heat_to_scrum(analysis, residues)
        if scrum_promotion:
            promotions.append(scrum_promotion)

    # 2. Check if task shadow should promote to policy
    if analysis["task_shadow"] >= PromotionThresholds.TASK_SHADOW_TO_POLICY:
        policy_promotion = promote_task_shadow_to_policy(analysis, residues)
        if policy_promotion:
            promotions.append(policy_promotion)

    # 3. Check if delegation patterns should promote to SOP
    delegation_values = list(analysis["delegation_confidence"].values())
    avg_delegation_confidence = (
        sum(delegation_values) / len(delegation_values) if delegation_values else 0
    )

    if avg_delegation_confidence >= PromotionThresholds.DELEGATION_TO_SOP:
        sop_promotion = promote_delegation_to_sop(analysis, residues)
        if sop_promotion:
            promotions.append(sop_promotion)

    # 4. Check if spatial patterns should promote to routing rules
    spatial_residues = [
        r
        for r in residues
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.SPATIAL.value
    ]
    high_intensity_spatial = [
        r
        for r in spatial_residues
        if r.intensity >= PromotionThresholds.SPATIAL_TO_ROUTING
    ]

    if high_intensity_spatial:
        routing_promotion = promote_spatial_to_routing(high_intensity_spatial, analysis)
        if routing_promotion:
            promotions.append(routing_promotion)

    # 5. Check if outcomes should promote to memory strengthening
    outcome_residues = [
        r
        for r in residues
        if hasattr(r, "trace_type") and r.trace_type == ResidueType.OUTCOME.value
    ]
    successful_outcomes = [
        o
        for o in outcome_residues
        if o.outcome_type == "completed"
        or (
            o.success_metrics
            and o.success_metrics.get("usefulness_score", 0)
            >= PromotionThresholds.OUTCOME_TO_MEMORY
        )
    ]

    if len(successful_outcomes) >= 3:
        memory_promotion = promote_outcome_to_memory(successful_outcomes, analysis)
        if memory_promotion:
            promotions.append(memory_promotion)

    return promotions


if __name__ == "__main__":
    print("Testing Promotion Engine...")

    # First add some test residues using the residue logger
    print("\n=== Creating test residues ===")
    from residue_logger import (
        deposit_conversation_residue,
        deposit_task_residue,
        deposit_delegation_residue,
        deposit_spatial_residue,
        deposit_outcome_residue,
    )

    # Create conversation residues with review-related topics
    deposit_conversation_residue(
        session_id="promo-test-001",
        topic="Code review for PR #42",
        participants=["Alice", "Bob"],
        location="conference_room",
        content="We need to get this PR reviewed and merged. It's been blocked for days and we need approval.",
    )

    deposit_conversation_residue(
        session_id="promo-test-002",
        topic="Stale backlog items",
        participants=["Charlie", "Alice"],
        location="kitchen",
        content="There are so many stale items in the backlog. We should clean them up ASAP.",
    )

    # Create task residues
    deposit_task_residue(
        session_id="promo-test-001",
        task_id="task-001",
        title="Fix critical bug",
        status="blocked",
    )

    deposit_task_residue(
        session_id="promo-test-002",
        task_id="task-002",
        title="Update documentation",
        status="in_progress",
    )

    # Create delegation residues
    deposit_delegation_residue(
        session_id="promo-test-001",
        delegator="Alice",
        delegatee="Bob",
        request_type="code_review",
    )

    deposit_delegation_residue(
        session_id="promo-test-002",
        delegator="Charlie",
        delegatee="Bob",
        request_type="code_review",
    )

    # Create spatial residues
    deposit_spatial_residue(
        location="kitchen",
        event_type="casual_discussion",
        topic="Project planning",
        participants=["Alice", "Bob", "Charlie"],
        intensity=0.7,
    )

    # Create outcome residues
    deposit_outcome_residue(
        session_id="promo-test-001",
        task_id="task-001",
        outcome_type="completed",
        success_metrics={
            "usefulness_score": 0.9,
            "time_to_completion": 60,
            "quality_indicators": {"code_quality": 0.9, "test_coverage": 0.8},
        },
    )

    deposit_outcome_residue(
        session_id="promo-test-002",
        task_id="task-002",
        outcome_type="completed",
        success_metrics={
            "usefulness_score": 0.8,
            "time_to_completion": 45,
            "quality_indicators": {"code_quality": 0.8},
        },
    )

    deposit_outcome_residue(
        session_id="promo-test-003",
        task_id="task-003",
        outcome_type="completed",
        success_metrics={
            "usefulness_score": 0.85,
            "time_to_completion": 90,
            "quality_indicators": {"code_quality": 0.85},
        },
    )

    print("\n=== Running Promotion Evaluation ===")
    promotions = evaluate_promotions()

    if promotions:
        print(f"\n{len(promotions)} promotions triggered:")
        for i, promo in enumerate(promotions, 1):
            print(f"\n--- Promotion {i} ---")
            print(f"Type: {promo.promotion_type}")
            print(f"Title: {promo.title}")
            print(f"Description: {promo.description}")
            print(f"Rationale: {promo.rationale}")
            if promo.metadata:
                print(f"Metadata: {promo.metadata}")
    else:
        print("\nNo promotions triggered - thresholds not met or no residues yet")

    print("\nPromotion Engine test complete!")
