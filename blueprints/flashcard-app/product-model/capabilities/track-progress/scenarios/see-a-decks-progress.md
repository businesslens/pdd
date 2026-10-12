---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Learner opens a deck they own
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
      mobile:
        place: flashcards-mobile::deck-library
  - text: The Product counts new, learning and known cards and those due today
    kind: product
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::deck-detail
      mobile:
        place: flashcards-mobile::deck-library
---

# See a deck's progress

## Trigger

The Learner wants to know where a deck they own stands.

## Outcome

The Learner sees how many of the deck's cards are new, learning and known, and
how many are due today.

## Edge cases

- The deck holds no cards → every count reads zero.
