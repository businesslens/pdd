---
domain: cards
relations:
  - entity: comment
    verb: has
    cardinality: one-to-many
  - entity: stall-flag
    verb: carries
    cardinality: one-to-many
  - entity: teammate
    verb: assigned to
    cardinality: many-to-many
---

# Card

One piece of the team's work, sitting in one column of a board.

## Information kept

- **Title** — a short statement of the work
- **Description** — what the work involves, in the members' own words
- **Assignees** — the members working on it, if anyone is
- **Due date** — when it should be finished, if the team set one
- **Column** — the column it sits in
- **Position** — its place within that column, from top to bottom
- **Entered column at** — when it arrived in its current column
