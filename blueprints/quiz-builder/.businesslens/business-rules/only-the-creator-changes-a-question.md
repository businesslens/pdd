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
question to it. The Product can draft a question from source material, but
only the Creator puts it in a quiz.

## Rationale

A question decides a learner's score. The person accountable for that score
must be the one who wrote or approved every word of it.
