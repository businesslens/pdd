---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner chooses to stop sharing a deck they own
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name, Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product explains that the share link will stop working and that copies already made stay with the Learners who made them
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner confirms
    kind: actor
    actor: learner
    entities:
      - { entity: deck, from: Shared, to: Private, facts: [Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Stop sharing a deck

## Trigger

The Learner takes back a deck they shared.

## Outcome

The deck is private, its share link opens nothing, and the deck and its cards
are otherwise unchanged. Copies made while it was shared are unaffected.

## Edge cases

- The Learner declines to confirm → the deck stays shared and its link keeps working.
