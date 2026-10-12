---
appliesTo:
  - type: entity
    id: column
    effect: reads
permits:
  - related: [{ verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - related: [{ verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
  - unattended: true
---

# Only members and their AI agents see a board's columns

A board's columns are seen only by the Teammates who are members of the board,
by an AI agent a member has connected, and by the Product's own check for
stalled cards. Anyone else cannot see them.

## Rationale

The columns show how the team works; they are shared only with the people the
team added, like the board itself.
