---
appliesTo:
  - type: entity
    id: stall-flag
    effect: reads
permits:
  - related: [{ verb: carries, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - related: [{ verb: carries, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
  - unattended: true
---

# Only members and their AI agents see a board's stall flags

The stall flags on a board's cards are seen only by the Teammates who are
members of the board, by an AI agent a member has connected, and by the
Product's own check for stalled cards. Anyone else cannot see them.

## Rationale

A flag says which of the team's work has stopped moving; it is shared only
with the people the team added, like the board itself.
