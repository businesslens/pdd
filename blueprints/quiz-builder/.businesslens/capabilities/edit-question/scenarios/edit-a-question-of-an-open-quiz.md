---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator changes the accepted answers of a short-answer question in an open quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: short-answer-question, effect: reads, facts: [Accepted answers] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says that submitted attempts keep their scores
    kind: product
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: short-answer-question, effect: changes, facts: [Accepted answers] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: Attempts submitted afterwards are scored against the new answers
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [Score] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Edit a question of an open quiz

## Trigger

The Creator finds a mistake in a quiz learners are already taking.

## Outcome

Later attempts are scored against the corrected question; submitted attempts
keep the scores they were given.

## Edge cases

- The Creator wants an earlier attempt rescored → they grade that answer by hand.
