---
appliesTo:
  - type: entity
    id: proposed-card
    effect: changes
permits:
  - related: [{ verb: receives, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
---

# Only the board's members accept or dismiss its proposed cards

A proposed card is accepted or dismissed only by a Teammate who is a member of
its board. An AI agent never decides on a proposal, its own or another's.

## Rationale

A proposal is a suggestion to the team; deciding on it is the team's own call.
