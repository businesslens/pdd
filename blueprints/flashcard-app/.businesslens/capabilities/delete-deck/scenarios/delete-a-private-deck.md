---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner chooses to delete a deck they own
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product explains that the deck, its cards, their progress and any waiting card proposals will be deleted
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
      - { entity: card, as: new-card, effect: reads, facts: [] }
      - { entity: card, as: learning-card, effect: reads, facts: [] }
      - { entity: card, as: known-card, effect: reads, facts: [] }
      - { entity: card-proposal, effect: reads, facts: [] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner confirms
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: removes, from: Private }
      - { entity: card, as: new-card, effect: removes, from: New }
      - { entity: card, as: learning-card, effect: removes, from: Learning }
      - { entity: card, as: known-card, effect: removes, from: Known }
      - { entity: card-proposal, effect: removes }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product returns the Learner to their library
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-library
---

# Delete a private deck

## Trigger

The Learner chooses to delete a private deck they own.

## Outcome

The deck, its cards, their progress and any card proposals waiting in it are
gone, and the Learner's other decks are unchanged.

## Edge cases

- The Learner declines to confirm → the deck and everything in it stay as they were.
