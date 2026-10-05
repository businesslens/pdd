---
appliesTo:
  - type: entity
    id: proposed-card
    effect: creates
  - type: entity
    id: stall-flag
    effect: creates
permits:
  - actors: [ai-agent]
---

# Only the AI agent proposes cards and raises stall flags

Proposed cards and stall flags come only from the AI agent. Teammates add cards
to the board directly and see a stalled card for themselves.

## Rationale

Proposals and flags are the agent's suggestions, kept apart from the members'
own work so that everyone can tell which is which.
