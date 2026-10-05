---
appliesTo:
  - type: entity
    id: habit
    effect: changes
    facts: [Schedule]
---

# A new schedule applies from the day it is set

When a habit's schedule changes, whether the Owner edits it or accepts a
suggested adjustment, the new schedule decides which days are due from that day
on. Earlier days keep counting against the schedule they had, so the history
and streak are not rewritten.

## Rationale

Making a schedule realistic should not cost the Owner the record they already
built.
