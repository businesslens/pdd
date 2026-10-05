---
appliesTo:
  - type: entity
    id: habit
    effect: changes
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner changes a habit

A habit's name, schedule and whether it is paused change only when its Owner
changes them, directly or by accepting a suggested adjustment. Nothing the
Product prepares on its own schedule changes a habit.

## Rationale

The weekly reflection may read a habit and propose a new schedule; keeping
every change in the Owner's hands is what makes that proposal safe to offer.
