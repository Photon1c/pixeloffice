# Time Orchestrator Agent Strategy

**Agent ID:** time-orchestrator  
**Type:** Meta-layer Orchestrator (using ZeroClaw)  
**Model:** PhysicsObsession/blase-3b:latest (via Ollama) or fallback to gpt-4.1-mini

## Overview

The Time Orchestrator is a meta-layer agent that handles routing, timing, and coordination across the Pixel Office agent ecosystem. It replaces the Hermes (White Rabbit) concept with a ZeroClaw-powered implementation.

## Core Responsibilities

- **Observe System State**: Monitor tasks, sessions, and agent status in real-time
- **Route Events**: Direct incoming events to appropriate agents based on context
- **Trigger Workflows**: Initiate standups, SCRUM sessions, cooldown periods, and task routing
- **Maintain Cadence**: Keep the system heartbeat consistent across all agents

## Event Handlers

| Event | Action |
|-------|--------|
| `task_created` | Assess priority, route to appropriate agent or queue |
| `agent_idle` | Check for pending work, assign idle agents |
| `session_started` | Log session, update task status, notify relevant agents |
| `deadline_near` | Escalate priority, reassign if needed, notify stakeholders |
| `error_detected` | Log error, trigger recovery workflow, notify appropriate agents |

## Workflow Triggers

1. **Standup**: Daily check-in workflow - collect status from all agents
2. **SCRUM**: Periodic workflow - run SCRUM session, update task board
3. **Cooldown**: After intensive sessions - trigger recovery/rest period
4. **Task Routing**: Continuous - match tasks to best-suited agents

## Integration Points

- Uses ZeroClaw CLI for orchestration tasks
- Connects to existing `tasks_v2`, `events`, and `sessions` tables
- Leverages MiroZero dashboard for monitoring and manual intervention

## Usage

The Time Orchestrator can be invoked via:

```bash
zeroclaw -m "Analyze current task load and trigger standup if needed" --provider ollama --model PhysicsObsession/blase-3b:latest
```

Or via MiroZero at http://localhost:5050

## Constraints

- Does NOT write directly to `~/.openclaw/` or shared configs
- Does NOT bypass OpenClaw execution pathways
- Stateless or minimally stateful (persists only to designated storage)
- All actions must be observable and reversible

## Status

- ✅ Agent card added to `config/agent-cards.json`
- ✅ Configured to use ZeroClaw with PhysicsObsession/blase-3b:latest model
- ⏳ Integration with event system pending
- ⏳ Workflow trigger implementation pending
