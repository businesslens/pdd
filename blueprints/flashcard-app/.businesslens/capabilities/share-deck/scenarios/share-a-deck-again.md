---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner chooses to share a deck they own that they stopped sharing earlier
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
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
  - text: The Product shows a new share link, and the earlier link still opens nothing
    kind: product
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Share link] }
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Share a deck again

## Trigger

The Learner shares a deck they stopped sharing earlier.

## Outcome

The deck is shared at a new share link. Whoever still holds the earlier link
does not get the deck back through it.
