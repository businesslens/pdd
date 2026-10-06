---
appliesTo:
  - type: entity
    id: goal
    effect: removes
permits:
  - related: [{ verb: owns, entity: student }]
---

# Only the Student deletes their goals

A goal, with everything under it, is deleted only by the Student who owns it.

## Rationale

Deleting a goal removes its logged study for good, so only the person whose record it is decides it.
