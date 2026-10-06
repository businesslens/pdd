---
appliesTo:
  - type: entity
    id: choice-question
    effect: removes
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator removes a choice question

Only the Creator who owns the quiz removes one of its choice questions, once
they confirm, dismisses a proposed one, or deletes the quiz with them. The
language model that drafted a question never dismisses it.

## Rationale

Removing a question changes what every later learner is asked, which only the
quiz's author decides.
