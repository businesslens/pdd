---
kind: edge
result: not-achieved
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
  - text: The Learner rates some of the due cards
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
  - text: The Learner leaves the session with cards still due
    kind: actor
    actor: learner
    capability: study-deck
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
---

# Leave before the session ends

## Trigger

The Learner stops studying before every due card has been rated.

## Outcome

The Journey goal is not achieved: the ratings already given are kept, and the
cards not yet rated stay due for the next session.
