---
appliesTo:
  - type: entity
    id: question
    effect: changes
permits:
  - related: [{ verb: contains, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the creator changes a question

Only the Creator who owns the quiz edits one of its questions or adds a drafted
question to it. The Quiz assistant can draft a question but can never change
one or put it in a quiz.

## Rationale

A question decides a learner's score. The person accountable for that score
must be the one who wrote or approved every word of it.
