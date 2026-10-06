---
appliesTo:
  - type: entity
    id: board
    effect: removes
permits:
  - related: [{ verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only the board's admins delete it

A board is deleted only by a Teammate whose role on that board is Admin, once
they confirm, and everything on it goes with it.

## Rationale

Deleting a board takes every member's work and conversation with it, so it
rests with the people the team chose to arrange the board.
