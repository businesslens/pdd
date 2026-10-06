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
and the members who may work there. Deleting a board takes everything on it
with it.

## Information kept

- **Name** — what the team calls the board
- **Stall threshold** — how many calendar days, weekends included, a card may stay in one column before the Product flags it as stalled; seven unless an admin changes it
- **Member count** — how many Teammates are members of it; none only while the Product is creating it, before its creator becomes its first admin
