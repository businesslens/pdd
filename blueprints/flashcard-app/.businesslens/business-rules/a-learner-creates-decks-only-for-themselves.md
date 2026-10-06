---
appliesTo:
  - type: entity
    id: deck
    effect: creates
permits:
  - related: [{ verb: owns, entity: learner }]
---

# A Learner creates decks only for themselves

Creating a deck or copying a shared one puts the new deck in the library of the
Learner who did it, and they own it. Nobody creates a deck in another Learner's
library.

## Rationale

A library is one person's study material; nothing appears in it that its
owner did not put there.
