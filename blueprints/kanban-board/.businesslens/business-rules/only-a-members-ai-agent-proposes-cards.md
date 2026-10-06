---
appliesTo:
  - type: entity
    id: proposed-card
    effect: creates
permits:
  - related: [{ verb: receives, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
---

# Only an AI agent a member connected proposes cards for a board

Proposed cards come only from an AI agent connected by a Teammate who is a
member of the board. Teammates add cards to the board directly.

## Rationale

Proposals are the agent's suggestions, kept apart from the members' own work so
that everyone can tell which is which.
