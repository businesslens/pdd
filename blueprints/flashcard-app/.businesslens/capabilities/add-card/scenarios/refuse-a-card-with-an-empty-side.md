---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner leaves the front or the back empty and tries to add it
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product explains that both sides need text
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Refuse a card with an empty side

## Trigger

The Learner tries to add a card with nothing on its front or its back.

## Outcome

No card is added, and the text the Learner already wrote stays in place to
finish.
