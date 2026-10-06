---
appliesTo:
  - type: entity
    id: attempt
    effect: creates
permits:
  - related: [{ verb: makes, entity: learner }]
---

# A learner makes one attempt of their own at an open quiz

An attempt is started by the learner it belongs to, only while its quiz is open,
and each learner has one attempt at a quiz. A learner who returns to a quiz they
submitted sees their result and can practice instead.

## Rationale

One attempt per learner keeps results comparable across a class and per
question. Practice rounds give learners as many further tries as they want
without disturbing that record.
