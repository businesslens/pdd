---
appliesTo:
  - type: entity
    id: check-in
    effect: creates
permits:
  - related: [{ verb: records, entity: habit }, { verb: owns, entity: owner }]
---

# Only the Owner checks off a habit

A check-in is recorded only when the Owner checks off one of their habits. The
Product never records one on its own, however a week has gone.

## Rationale

A streak means something only if every day in it was a day the Owner said they
did the habit.
