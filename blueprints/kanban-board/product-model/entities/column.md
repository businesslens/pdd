---
domain: cards
relations:
  - entity: card
    verb: holds
    cardinality: one-to-many
---

# Column

One stage of a board's workflow, such as To do, Doing or Done. Cards move from
column to column as work progresses, and the board's last column is where
finished work rests.

## Information kept

- **Name** — the stage it stands for
- **Position** — where it sits among the board's columns, from first to last
