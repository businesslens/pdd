---
appliesTo:
  - type: entity
    id: card
    effect: removes
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner removes its cards

Only the Learner who owns a deck removes a card from it.

## Rationale

Removing a card also removes the progress made on it, which only its owner may
give up.
