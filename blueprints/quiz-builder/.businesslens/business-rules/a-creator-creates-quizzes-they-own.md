---
appliesTo:
  - type: entity
    id: quiz
    effect: creates
permits:
  - related: [{ verb: owns, entity: creator }]
---

# A Creator creates quizzes they own

Every quiz is created by a Creator and belongs to them from its first moment;
nobody creates a quiz on another person's behalf.

## Rationale

A quiz decides learners' scores, so it must have one accountable author from
the start.
