---
appliesTo:
  - type: entity
    id: column
    effect: changes
permits:
  - related: [{ verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only the board's admins rename or move its columns

A column is renamed, or moved to another place among the board's columns, only
by a Teammate whose role on that board is Admin.

## Rationale

The columns are the workflow every member's cards move through, so changing
them rests with the people the team chose to arrange the board.
