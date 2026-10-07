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
  - text: The Product presents the front of a known card that is due
    kind: product
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front, Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The Learner reveals the back and rates their recall Again
    kind: actor
    actor: learner
    entities:
      - { entity: card, from: Known, to: Learning, facts: [Due on, Interval] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The card comes back again before the session ends, its gap restarted at one day
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front, Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
---

# Forget a known card

## Trigger

The Learner cannot recall a card they had already come to know.

## Outcome

The card is learning again: it is asked once more in this session and then
comes back tomorrow.

## Edge cases

- The Learner rates a learning card Again → it stays learning and comes back the same way.
