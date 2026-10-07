---
appliesTo:
  - type: entity
    id: proposed-card
    effect: reads
permits:
  - related: [{ verb: receives, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - related: [{ verb: receives, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
---

# Only members and their AI agents see a board's proposed cards

The cards proposed for a board, waiting or decided, are seen only by the
Teammates who are members of the board and by an AI agent a member has
connected. Anyone else cannot see them.

## Rationale

A proposal is a suggestion to the team about its own plans; it is shared only
with the people the team added, like the board itself.
