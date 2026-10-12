---
kind: primary
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
  - text: The Product presents the front of a new card that is due
    kind: product
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front, Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The Learner tries to recall the answer and reveals the back
    kind: actor
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Back] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The Learner rates their recall Good
    kind: actor
    actor: learner
    entities:
      - { entity: card, from: New, to: Learning, facts: [Due on, Interval] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The card leaves this session and is due again in one day
    kind: condition
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
---

# Study a new card

## Trigger

The Learner studies a deck that has a new card due.

## Outcome

The card is learning, due again tomorrow, and the session moves on to the next
due card or ends when none is left.

## Decision points

### Which rating did the Learner give?

How well did the Learner recall the new card?

- Hard or Good → the card is due again in one day.
- Easy → the card is due again in four days.
