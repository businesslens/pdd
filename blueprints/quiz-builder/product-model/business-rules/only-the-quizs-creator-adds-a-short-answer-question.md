---
appliesTo:
  - type: entity
    id: short-answer-question
    effect: creates
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator adds a short-answer question

A short-answer question comes into a quiz only through its Creator: written by
hand, or drafted by the Product when the Creator asks for drafts from source
material.

## Rationale

What a quiz asks is the Creator's decision, including what they ask the Product
to propose.
