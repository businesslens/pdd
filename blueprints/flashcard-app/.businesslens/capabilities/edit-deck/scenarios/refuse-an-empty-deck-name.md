---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner clears the name of a deck they own and tries to save
    kind: actor
    actor: learner
    entities:
      - { entity: deck, effect: reads, facts: [Name] }
    contexts:
      web:
        place: flashcards-web::deck-detail
  - text: The Product explains that a name is required
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: flashcards-web::deck-detail
---

# Refuse an empty deck name

## Trigger

The Learner tries to save a deck with an empty name.

## Outcome

The deck keeps its earlier name, and the Learner can enter a name and save
again.
