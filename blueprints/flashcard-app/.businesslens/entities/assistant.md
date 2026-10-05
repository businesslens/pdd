---
kind: system
acts: internal
relations:
  - entity: card-proposal
    verb: drafts
    cardinality: one-to-many
---

# Assistant

The Product's drafting assistant. When a Learner pastes notes and asks for
cards, it chooses which facts in them are worth a card and drafts card
proposals for the Learner to keep or discard. It never adds a card to a deck,
and it drafts only when the deck's owner asks.
