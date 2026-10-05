---
domain: habits
relations:
  - entity: check-in
    verb: records
    cardinality: one-to-many
  - entity: suggested-adjustment
    verb: receives
    cardinality: one-to-many
---

# Habit

Something the Owner means to do regularly, on a schedule they chose.

## Information kept

- **Name** — what the Owner calls it
- **Schedule** — when it is due: every day, on chosen weekdays, or a number of times each week
- **Started on** — the first day it counts from
- **Current streak** — how many scheduled days, or weekly targets, in a row have been done, read from its check-ins
- **Best streak** — the longest streak it has reached

## States

### Active

Due on its schedule, listed on Today when due, and open to check-ins.

### Paused

Set aside by the Owner. It is not due and takes no check-ins, and it keeps its
schedule, history and streak until the Owner resumes it.
