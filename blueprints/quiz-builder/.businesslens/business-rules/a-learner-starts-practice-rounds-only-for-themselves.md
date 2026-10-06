---
appliesTo:
  - type: entity
    id: practice-round
    effect: creates
permits:
  - related: [{ verb: practices, entity: learner }]
---

# A learner starts practice rounds only for themselves

A practice round is assembled for the learner who asks for it, from their own
attempt and their own earlier rounds.

## Rationale

Practice follows one learner's own mistakes; a round assembled for anyone else
would repeat the wrong questions.
