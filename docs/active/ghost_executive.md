# User Role: The Ghost Executive

**Defined:** April 1, 2026

## Concept

"The Ghost Executive" is the user role in Pixel Office:

> The invisible authority whose traces shape the office before commands are ever spoken.

## Design Rationale

This role fits the stigmergy-based system because:
- **Traces over commands**: The user shapes office behavior through environmental signals (Review Heat, Task Shadows) rather than direct orders
- **Invisible influence**: Like stigmergic pheromones, the Ghost Executive's presence is felt through the artifacts left behind
- **Before commands**: Setting the context/energy that agents operate within, even before explicit directives

## Implementation Notes

- User traces could be captured via:
  - Chat messages left in the office
  - Task Shadow deposits when assigning work
  - Review Heat signals when expressing concern
  - Manual intervention patterns

- Agents reference this role in system prompts as: "The Ghost Executive watches from above and shapes priorities through signals, not orders."

## Related
- See: `stigmergy.md` - how traces work
- See: `reviewHeat.ts` - how pressure signals work
- See: `taskShadows.ts` - how work residue accumulates