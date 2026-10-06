---
appliesTo:
  - type: entity
    id: card-proposal
    effect: removes
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner removes its card proposals

Card proposals are removed only with their deck, when its owner deletes it.

## Rationale

A proposal belongs to its deck, so it lasts exactly as long as its owner keeps
the deck.
