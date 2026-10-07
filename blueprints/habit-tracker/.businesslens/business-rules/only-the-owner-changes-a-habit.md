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
changes them, directly or by accepting a suggested adjustment.

## Rationale

A habit is the Owner's own intention; nothing else should be able to rewrite
it.
