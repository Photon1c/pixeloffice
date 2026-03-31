# Pixel Office Model Routing

This directory contains derived configuration for the Pixel Office runtime agents.

## Source of Truth

The canonical role-to-model decisions are owned by the **Registrar** located at:

- `~/projects/model_foundry/dev/REGISTRY.md`
- `~/projects/model_foundry/registrar/registry.json`
- `~/projects/model_foundry/registrar/routing_matrix.json`

## Derived Configuration

`opencode-local-agents.json` is a **derived config** generated from the Registrar's routing matrix.

### Current Routing (as of 2026-03-16)

**Primary Assignments:**
- **Receptionist / Intake** (`frontdesk`): `gemma-clerk`
- **Clerk / Case Routing** (`openclaw`, `sherlobster`): `gemma-clerk`
- **Executive / Managing Attorney** (`leslieclaw`): `physics-assistant:latest`
- **Specialist / Assigned Attorney** (`zeroclaw`, `hercule-prawnro`): `physics-assistant:latest`
- **Custodian / Operations** (`ironclaw`): `gemma-clerk`
- **Archivist / Records** (`hermitclaw`): `physics-assistant:latest`

**Fallback:** `gpt-4.1-mini` (remote OpenAI)

## Update Workflow

1. Run benchmarks via Registrar.
2. Update `routing_matrix.json` in the Registrar repo.
3. Propagate changes to `opencode-local-agents.json` in Pixel Office.
4. This file documents the state at the time of last sync.

## Notes

- Bench roster models (e.g., `phi3:mini`, `potatopeeler`) are configured in the Registrar but not set as primaries here.
- `physics-assistant:latest` is used for reasoning-heavy roles (Executive, Specialist, Archive).
- `gemma-clerk` is used for obedient, concise workflow roles (Clerk, Custodian, Receptionist).