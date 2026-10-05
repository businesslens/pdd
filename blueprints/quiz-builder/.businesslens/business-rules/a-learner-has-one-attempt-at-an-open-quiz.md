---
appliesTo:
  - type: entity
    id: attempt
    effect: creates
---

# A learner has one attempt at an open quiz

An attempt starts only while its quiz is open, and each learner has one attempt
at a quiz. A learner who returns to a quiz they submitted sees their result and
can practice instead.

## Rationale

One attempt per learner keeps results comparable across a class and per
question. Practice rounds give learners as many further tries as they want
without disturbing that record.
