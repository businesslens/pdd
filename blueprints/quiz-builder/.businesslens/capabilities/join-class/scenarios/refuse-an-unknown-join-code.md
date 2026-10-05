---
kind: validation
routes:
  web: Web
steps:
  - text: The Learner enters a join code
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: quiz-web::classes
  - text: No class has that code
    kind: condition
    entities:
      - { entity: class, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product says the code is not recognized and keeps it to correct
    kind: product
    actor: learner
    entities: []
    contexts:
      web:
        place: quiz-web::classes
---

# Refuse an unknown join code

## Trigger

The Learner enters a join code that belongs to no class.

## Outcome

The Learner joins nothing and can correct the code.
