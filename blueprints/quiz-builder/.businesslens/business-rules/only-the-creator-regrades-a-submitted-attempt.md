---
appliesTo:
  - type: entity
    id: attempt
    effect: changes
permits:
  - related: [{ verb: makes, entity: learner }]
    when: [{ state: In progress }]
  - related: [{ verb: receives, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the creator regrades a submitted attempt

A learner's answers change only while their attempt is in progress. Once it is
submitted, its answers' grades and its score change only when the Creator of the
quiz grades an answer by hand. Editing a question never rescores an attempt
already submitted.

## Rationale

A submitted score is a record the learner and the Creator both rely on. It moves
only by a deliberate decision of the person accountable for it.
