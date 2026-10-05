---
appliesTo:
  - type: entity
    id: board
    effect: changes
  - type: entity
    id: column
    effect: creates
  - type: entity
    id: column
    effect: changes
  - type: entity
    id: column
    effect: removes
  - type: entity
    id: board-membership
    effect: creates
  - type: entity
    id: board-membership
    effect: changes
permits:
  - actors: [teammate]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only admins change a board's settings, columns and members

A board's name and stall threshold, its columns, and who belongs to it with
which role are changed only by a Teammate whose role on that board is Admin.
The Teammate who creates a board becomes its first admin. Members work on the
board's cards; they do not reshape the board itself.

## Rationale

The columns and the member list are the shape every member works within, so a
change to them affects the whole team and rests with the people the team chose
to arrange the board.
