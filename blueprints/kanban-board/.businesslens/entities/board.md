---
relations:
  - entity: column
    verb: contains
    cardinality: one-to-many
  - entity: board-membership
    verb: has
    cardinality: one-to-many
  - entity: proposed-card
    verb: receives
    cardinality: one-to-many
---

# Board

A team's shared space for one stream of work: its columns, the cards in them,
and the members who may work there.

## Information kept

- **Name** — what the team calls the board
- **Stall threshold** — how many days a card may stay in one column before the AI agent may flag it; seven unless an admin changes it
