---
appliesTo:
  - type: entity
    id: enrollment
    effect: removes
permits:
  - related: [{ verb: has, entity: class }, { verb: owns, entity: creator }]
---

# Only its creator removes a learner from a class

A learner leaves a class only when the Creator who owns it removes them, once
the Creator confirms. A learner does not leave a class on their own, and no
classmate removes another.

## Rationale

A class is the Creator's roster: they answer for who is shown its quizzes,
including who no longer should be.
