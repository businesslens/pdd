---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner leaves the name empty and tries to create
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-library
  - text: The Product explains that a name is required
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-library
---

# Refuse a deck without a name

## Trigger

The Learner tries to create a deck with an empty name.

## Outcome

No deck is created, and the Learner can enter a name and try again.
