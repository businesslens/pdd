---
appliesTo:
  - type: entity
    id: choice-question
    effect: changes
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator changes a choice question

Only the Creator who owns the quiz edits one of its choice questions, proposed
or included, and accepts a proposed one into the quiz. The language model that
drafted a question never accepts it.

## Rationale

A question decides a learner's score. The person accountable for that score
must be the one who wrote or approved every word of it, and a language model's
drafts can be wrong in ways only the Creator can judge.
