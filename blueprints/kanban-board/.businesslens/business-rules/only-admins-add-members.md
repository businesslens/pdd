---
appliesTo:
  - type: entity
    id: board-membership
    effect: creates
permits:
  - related: [{ verb: has, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
  - related: [{ verb: has, entity: board }, { verb: creates, entity: teammate }]
---

# Only the board's admins add members to it

A Teammate becomes a member of a board only when an admin of that board adds
them, or by creating the board: the Product gives its creator the board's first
membership, as Admin, before anything else is added to it.

## Rationale

Who can see a board's plans is a decision about the team, and it rests with the
people the team chose to arrange the board. A new board has no admin yet, so its
creator is the one who starts it with one.
