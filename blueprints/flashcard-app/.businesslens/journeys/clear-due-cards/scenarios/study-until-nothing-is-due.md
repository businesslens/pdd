---
kind: primary
result: achieved
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Learner starts studying a deck they own that has cards due
    kind: actor
    actor: learner
    capability: study-deck
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
      mobile:
        place: flashcards-mobile::deck-library
  - text: The Learner recalls and rates each due card in turn
    kind: actor
    actor: learner
    capability: study-deck
    entities:
      - { entity: card, facts: [Due on, Interval] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The Product finds no card left due today and returns the Learner to the deck's progress
    kind: product
    actor: learner
    capability: track-progress
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
      mobile:
        place: flashcards-mobile::deck-library
---

# Study until nothing is due

## Trigger

The Learner sits down to study a deck that has cards due.

## Outcome

The Journey goal is achieved: no card in the deck is due today, and its
progress shows the new and learning cards the session moved on.
