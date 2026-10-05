---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner enters a name
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-library
  - text: The Learner creates the deck
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: creates, to: Private, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-library
  - text: The Product opens the new, empty deck
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Create a deck

## Trigger

The Learner chooses to start a new deck.

## Outcome

The Learner owns a new private deck with the chosen name and no cards, open and
ready for its first card.
