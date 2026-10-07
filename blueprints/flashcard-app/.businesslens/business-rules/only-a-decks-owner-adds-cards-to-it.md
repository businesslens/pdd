---
appliesTo:
  - type: entity
    id: card
    effect: creates
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner adds cards to it

A card enters a deck only when the deck's owner adds it, accepts a card
proposal, or makes the deck as a copy.

## Rationale

What a Learner studies is their decision, so nobody else puts a card in front
of them.
