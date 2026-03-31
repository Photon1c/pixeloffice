# Pixel Office Agent Roles

This document maps registry-style agent identifiers to their Pixel Office personas and primary functions.

## Core Agents

| Registry ID   | Pixel Office Persona | Primary Function                                   | Level       |
|--------------|----------------------|----------------------------------------------------|------------|
| Frontdesk    | Frontdesk            | Reception, onboarding, routing, office entrypoint | Operational |
| OpenClaw     | Openclaw             | Clerk / orchestration backbone, session routing   | Operational |
| IronClaw     | Ironclaw             | Custodian / infra maintenance, stability & hygiene| Operational |
| HermitClaw   | Hermitclaw           | Archivist / long-term memory & history            | Operational |

## Specialist & Executive Layer

| Registry ID   | Pixel Office Persona | Primary Function                                   | Level       |
|--------------|----------------------|----------------------------------------------------|------------|
| Zeroclaw     | Zeroclaw             | Heavy specialist / deep reasoning & refactoring   | Specialist  |
| Sherlobster  | Sherlobster          | Specialist investigator / executive partner        | Executive   |
| HerculePrawn | Hercule Prawnro      | Specialist investigator / executive partner        | Executive   |
| LeslieClaw   | LeslieClaw           | Executive / strategy, priorities & direction      | Executive   |

## Notes

- **Sherlobster and Hercule Prawnro** are both classified as **specialist investigators at the executive layer**. Their right role is to handle complex, ambiguous problems and partner with Leslie on high-level decisions, not to serve as operational front-desk staff.
- **Frontdesk** remains the canonical **receptionist / routing service** for the office. When we say "front desk" in system diagrams, we mean `Frontdesk` as the primary entrypoint, not Sherlobster.
- Pixel Office personas are visual/narrative representations of these roles. The registry (and OpenClaw) may use slightly different IDs, but this table is the source of truth for how they map conceptually inside the office.

## Future Work

- Run an audit of registry definitions vs. Pixel Office configuration to ensure there are no remaining title or role conflicts (especially around "front desk" terminology).
- Extend this table if new agents are added (e.g., ground-station specialists, SCRUM facilitators) so that every persona has a single clear home and purpose.
