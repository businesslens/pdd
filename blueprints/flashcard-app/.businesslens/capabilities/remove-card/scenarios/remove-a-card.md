---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner chooses to remove a card
    kind: actor
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner confirms
    kind: actor
    actor: learner
    entities:
      - { entity: card, effect: removes, from: Learning }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Remove a card

## Trigger

The Learner chooses to remove a card from a deck they own.

## Outcome

The card and the progress made on it are gone from the deck, and it no longer
counts toward the deck's progress. Copies other Learners made are unaffected.

## Edge cases

- The card is new or known → it is removed the same way, with whatever progress it has.
- The Learner declines to confirm → the card stays with its progress.
