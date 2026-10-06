---
appliesTo:
  - type: entity
    id: board
    effect: reads
permits:
  - related: [{ verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - related: [{ verb: has, entity: board-membership }, { verb: holds, entity: teammate }, { verb: connects, entity: ai-agent }]
  - unattended: true
---

# Only members and their AI agents open a board

A board and everything on it are visible to the Teammates who are its members,
to an AI agent a member has connected, and to the Product's own check for
stalled cards. Anyone else cannot open the board or learn that it exists.

## Rationale

A board holds a team's unfinished plans and who is doing what; it is shared
only with the people the team added.
