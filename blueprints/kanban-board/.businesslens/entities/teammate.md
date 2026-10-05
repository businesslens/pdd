---
kind: person
acts: external
relations:
  - entity: board-membership
    verb: holds
    cardinality: one-to-many
  - entity: comment
    verb: writes
    cardinality: one-to-many
---

# Teammate

A person with an account who works on the boards they are a member of. What a
Teammate may do on a board depends on the role their membership gives them
there.

## Information kept

- **Name** — the name other members see on cards, comments and the member list
- **Email address** — the address the Teammate signs in with and is added to a board by
