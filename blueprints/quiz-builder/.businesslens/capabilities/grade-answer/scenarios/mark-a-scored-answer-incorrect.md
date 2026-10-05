---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator opens a submitted attempt at their quiz with an answer that scored but should not have
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: attempt, effect: reads, facts: [Answers] }
      - { entity: question, effect: reads, facts: [Prompt, Correct answer] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Creator marks the answer incorrect
    kind: actor
    actor: creator
    entities:
      - { entity: attempt, effect: changes, facts: [Answers] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product recalculates the attempt's score
    kind: product
    actor: creator
    entities:
      - { entity: attempt, effect: changes, facts: [Score] }
      - { entity: question, effect: reads, facts: [Points] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Mark a scored answer incorrect

## Trigger

The Creator finds an answer that scored only because an accepted answer was too
loose.

## Outcome

The answer no longer counts, and the attempt's score drops by its points.
