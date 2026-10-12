---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Learner starts studying a deck they own
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
      mobile:
        place: flashcards-mobile::deck-library
  - text: No card is due today
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The Product says nothing is due and when the next card comes back
    kind: product
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
---

# Open a deck with nothing due

## Trigger

The Learner starts studying a deck that has no card due today.

## Outcome

No card is shown or changed, and the Learner knows when the deck next has
something to study.

## Edge cases

- The deck holds no cards at all → the Product says so and nothing comes back.
