---
appliesTo:
  - type: entity
    id: board
    effect: reads
permits:
  - related: [{ verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
  - actors: [ai-agent]
---

# Only members and their AI agent open a board

A board and everything on it are visible to the Teammates who are its members,
and to an AI agent acting for one of those members. The agent reads only the
boards the member it acts for belongs to. Anyone else cannot open the board or
learn that it exists.

## Rationale

A board holds a team's unfinished plans and who is doing what; it is shared
only with the people the team added.
