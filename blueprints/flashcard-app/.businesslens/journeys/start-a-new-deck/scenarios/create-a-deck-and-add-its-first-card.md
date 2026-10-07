---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Learner creates and names a deck
    kind: actor
    actor: learner
    capability: create-deck
    entities:
      - { entity: deck, effect: creates, to: Private, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-library
  - text: The Product opens the new, empty deck
    kind: product
    actor: learner
    capability: create-deck
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner adds the first card with a front and a back
    kind: actor
    actor: learner
    capability: add-card
    entities:
      - { entity: card, effect: creates, to: New, facts: [Front, Back, Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Create a deck and add its first card

## Trigger

The Learner starts a deck for something new they want to remember.

## Outcome

The Journey goal is achieved: the new deck holds its first card, due today.
