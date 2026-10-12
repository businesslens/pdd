---
appliesTo:
  - type: entity
    id: board
    effect: changes
permits:
  - related: [{ verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only the board's admins change its settings

A board's name and stall threshold are changed only by a Teammate whose role on
that board is Admin.

## Rationale

The stall threshold decides which cards every member sees flagged, so it rests
with the people the team chose to arrange the board.
