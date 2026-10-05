---
appliesTo:
  - type: entity
    id: board-membership
    effect: removes
permits:
  - related: [{ verb: holds, entity: teammate }]
  - actors: [teammate]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only an admin or the member themselves ends a membership

An admin of a board removes any member from it, and any member leaves the board
on their own. Nobody else ends a membership.

## Rationale

Leaving must never depend on someone else, and removing a colleague is a
decision about the team that rests with its admins.
