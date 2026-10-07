---
appliesTo:
  - type: entity
    id: board-membership
    effect: changes
permits:
  - related: [{ verb: has, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only the board's admins change a member's role

A member's role on a board changes between Admin and Member only by a Teammate
whose role on that board is Admin.

## Rationale

The Admin role decides who reshapes the board, so only those already trusted
with it hand it on or take it back.
