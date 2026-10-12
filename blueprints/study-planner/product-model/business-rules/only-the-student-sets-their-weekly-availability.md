---
appliesTo:
  - type: entity
    id: student
    effect: changes
    facts: [Weekly availability]
permits:
  - self: true
---

# Only the Student sets their weekly availability

A Student's weekly availability is set only by that Student. The AI agent never
widens it to make a plan fit.

## Rationale

The availability is the Student's own account of the time they have; every plan
is built inside it.
