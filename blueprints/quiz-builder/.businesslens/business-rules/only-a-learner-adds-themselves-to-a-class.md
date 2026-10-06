---
appliesTo:
  - type: entity
    id: class
    effect: changes
    facts: [Learners]
permits:
  - related: [{ verb: enrolls, entity: learner }]
---

# Only a learner adds themselves to a class

A learner joins a class by entering its join code themselves. Nobody, not even
the class's Creator, adds a learner to it.

## Rationale

Joining shows a learner every quiz the class is assigned, so it is the learner's
own act, made with a code the Creator chose to pass on.
