---
appliesTo:
  - type: entity
    id: board-membership
    facts: [Role]
---

# Every board keeps at least one admin

While a board exists, a membership whose removal or change of role would leave
it without an admin is refused, and the member keeps the role they had. Only
deleting the board ends its last admin's membership, together with every other.

## Rationale

A board without an admin could never again change its columns, settings or
members.
