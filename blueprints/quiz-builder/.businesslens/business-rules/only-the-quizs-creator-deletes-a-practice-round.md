---
appliesTo:
  - type: entity
    id: practice-round
    effect: removes
permits:
  - related: [{ verb: is practiced in, entity: quiz }, { verb: owns, entity: creator }]
---

# Only the quiz's creator deletes a practice round

A practice round is deleted only when the Creator of its quiz deletes the quiz,
whose questions it repeats. Its learner never deletes one, and the Creator never
sees one.

## Rationale

A practice round repeats questions that exist only while their quiz does.
