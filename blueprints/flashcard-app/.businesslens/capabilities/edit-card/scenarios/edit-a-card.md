---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner changes the front or back of a card
    kind: actor
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front, Back] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner saves the card
    kind: actor
    actor: learner
    entities:
      - { entity: card, facts: [Front, Back] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The card keeps the day it is due
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Edit a card

## Trigger

The Learner chooses to correct or improve a card in a deck they own.

## Outcome

The card shows the new text and comes back for study on the same day as before.

## Edge cases

- Either side is left empty → the card is not saved and the Learner's changes stay in place to finish.
