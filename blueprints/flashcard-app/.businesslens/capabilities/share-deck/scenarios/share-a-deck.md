---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner chooses to share a private deck they own
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product explains that any signed-in Learner with the link will see the deck's cards and may copy them, but never its progress
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Learner confirms
    kind: actor
    actor: learner
    entities:
      - { entity: deck, from: Private, to: Shared, facts: [Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product shows the share link to pass on
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Share a deck

## Trigger

The Learner chooses to share a private deck they own.

## Outcome

The deck is shared: its share link opens the deck read-only for any signed-in
Learner, and the owner's progress stays private.

## Edge cases

- The Learner declines to confirm → the deck stays private with no share link.
