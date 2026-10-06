---
appliesTo:
  - type: entity
    id: short-answer-question
    effect: changes
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator changes a short-answer question

Only the Creator who owns the quiz edits one of its short-answer questions,
proposed or included.

## Rationale

A question decides a learner's score. The person accountable for that score
must be the one who wrote or approved every word of it.
