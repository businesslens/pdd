---
appliesTo:
  - type: entity
    id: board-membership
    effect: removes
  - type: entity
    id: board-membership
    effect: changes
    facts: [Role]
---

# Every board keeps at least one admin

A membership whose removal or change of role would leave the board without an
admin is refused, and the member keeps the role they had.

## Rationale

A board without an admin could never again change its columns, settings or
members.
