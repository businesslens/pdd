---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner saves a change to a card in a deck they share
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [] }
      - { entity: card, facts: [Front, Back] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The deck's share link presents the changed card
    kind: condition
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Share link] }
      - { entity: card, effect: reads, facts: [Front, Back] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Edit a card in a shared deck

## Trigger

The Learner changes a card in a deck they own while it is shared.

## Outcome

Learners opening the share link see the changed card. Copies made before the
change keep the text they were copied with.
