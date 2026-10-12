---
appliesTo:
  - type: entity
    id: habit
    effect: creates
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner creates a habit

A habit is created only by the Owner it will belong to. The Product never adds
one, and a suggested adjustment never proposes one.

## Rationale

Every habit should be one the Owner chose to keep up.
