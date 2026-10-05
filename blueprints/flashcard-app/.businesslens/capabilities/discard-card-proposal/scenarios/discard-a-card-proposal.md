---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner discards a card proposal
    kind: actor
    actor: learner
    entities:
      - { entity: card-proposal, effect: removes }
    contexts:
      web:
        place: flashcards-web::card-proposals
  - text: Nothing is added to the deck
    kind: condition
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [] }
    contexts:
      web:
        place: flashcards-web::card-proposals
---

# Discard a card proposal

## Trigger

The Learner rejects a card proposal.

## Outcome

The proposal is gone and the deck's cards are unchanged.
