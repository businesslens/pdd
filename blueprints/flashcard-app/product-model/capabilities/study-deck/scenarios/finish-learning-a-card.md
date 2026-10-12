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
  - text: The Product presents the front of a learning card that is due
    kind: product
    actor: learner
    entities:
      - { entity: card, effect: reads, facts: [Front, Due on] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The Learner reveals the back and rates their recall Good, which lengthens the gap to 21 days or more
    kind: actor
    actor: learner
    entities:
      - { entity: card, from: Learning, to: Known, facts: [Due on, Interval] }
    contexts:
      web:
        place: flashcards-web::study-session
      mobile:
        place: flashcards-mobile::study-session
  - text: The card counts as known and is due again after its new gap
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

# Finish learning a card

## Trigger

The Learner recalls a learning card well enough that its gap reaches 21 days.

## Outcome

The card counts as known in the deck's progress and stays away until its new
due day.

## Edge cases

- The new gap stays under 21 days → the card stays learning and is due after that gap.
