---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner opens a submitted attempt in which every answer scored
    kind: actor
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Answers, Score] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product says there is nothing to practice
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: No practice round is started
    kind: condition
    actor: learner
    entities:
      - { entity: practice-round, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Find nothing to practice

## Trigger

The Learner got every question of the quiz right.

## Outcome

The Learner knows there is nothing to practice, and no practice round exists.
