---
appliesTo:
  - type: entity
    id: attempt
    effect: removes
permits:
  - related: [{ verb: receives, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator deletes an attempt

An attempt is deleted only when the Creator of its quiz deletes the quiz. Its
learner never withdraws it.

## Rationale

A submitted attempt is the record both the learner and the Creator rely on; it
lasts as long as the quiz it answers.
