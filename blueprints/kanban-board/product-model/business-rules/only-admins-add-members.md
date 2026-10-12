---
appliesTo:
  - type: entity
    id: board-membership
    effect: creates
permits:
  - related: [{ verb: has, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only the board's admins add members to it

A Teammate becomes a member of a board only when an admin of that board adds
them. The board's first membership, its creator's as Admin, goes with creating
the board, so it needs no grant here; after that, its creator adds members only
while their own role on it is Admin.

## Rationale

Who can see a board's plans is a decision about the team, and it rests with the
people the team chose to arrange the board. A new board has no admin yet, so its
creator becomes its first one as part of creating it.
