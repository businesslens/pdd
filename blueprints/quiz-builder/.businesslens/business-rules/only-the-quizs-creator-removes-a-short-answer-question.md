---
appliesTo:
  - type: entity
    id: short-answer-question
    effect: removes
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator removes a short-answer question

Only the Creator who owns the quiz removes one of its short-answer questions,
dismisses a proposed one, or deletes the quiz with them.

## Rationale

Removing a question changes what every later learner is asked, which only the
quiz's author decides.
