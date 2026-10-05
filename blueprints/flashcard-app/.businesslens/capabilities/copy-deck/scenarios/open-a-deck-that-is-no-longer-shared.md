---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner opens a share link after its owner stopped sharing or deleted what it opened
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Product finds nothing shared at the link
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::shared-deck
  - text: The Product says the link no longer works, without revealing what it used to open
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::shared-deck
---

# Open a deck that is no longer shared

## Trigger

The Learner opens a share link after its owner stopped sharing the deck or
deleted it.

## Outcome

Nothing about the deck is presented, there is nothing to copy, and the Learner
knows the link no longer works.
