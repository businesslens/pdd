---
appliesTo:
  - type: entity
    id: card
    effect: creates
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner adds cards to it

A card enters a deck only when the deck's owner adds it, keeps a card proposal,
or makes the deck as a copy. The Assistant never adds a card: what it drafts
waits as a card proposal until the owner keeps it.

## Rationale

What a Learner studies is their decision. A drafting mistake must cost one
discard, never a wrong card studied for weeks.
