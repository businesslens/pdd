---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner writes a front and a back
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner adds the card
    kind: actor
    actor: learner
    entities:
      - { entity: card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The new card is listed and counted as due today
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front, Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Add a card

## Trigger

The Learner chooses to add a card to a deck they own.

## Outcome

The deck holds a new card with the given front and back, due for study today.
