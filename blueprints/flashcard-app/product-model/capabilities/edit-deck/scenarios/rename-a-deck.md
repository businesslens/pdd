---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner changes the name of a deck they own
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner saves the deck
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: changes, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product shows the new name, here and in the Learner's library
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Rename a deck

## Trigger

The Learner chooses to give a deck they own a new name.

## Outcome

The deck has the new name and is otherwise unchanged.

## Edge cases

- The deck is shared → its share link presents the new name, and copies made earlier keep the name they were copied with.
