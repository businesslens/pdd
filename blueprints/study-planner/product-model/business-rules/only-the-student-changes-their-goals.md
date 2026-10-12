---
appliesTo:
  - type: entity
    id: goal
    effect: changes
permits:
  - related: [{ verb: owns, entity: student }]
---

# Only the Student changes their goals

A goal's name and target date are changed only by the Student who owns it. The AI agent plans from them as they are and never moves a date to make a plan fit.

## Rationale

A plan that quietly moved the date would hide exactly the shortfall the Student needs to see.
