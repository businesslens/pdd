---
appliesTo:
  - type: entity
    id: comment
    effect: reads
permits:
  - related: [{ verb: has, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - related: [{ verb: has, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
---

# Only members and their AI agents see a board's comments

The comments on a board's cards are read only by the Teammates who are members
of the board and by an AI agent a member has connected. Anyone else cannot see them.

## Rationale

Comments are the team's conversation about its own work, written for the
people on the board.
