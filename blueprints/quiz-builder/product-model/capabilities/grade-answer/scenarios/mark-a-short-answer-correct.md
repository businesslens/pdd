---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator opens a submitted attempt at their quiz with a short answer that did not score
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: attempt, effect: reads, facts: [Answers] }
      - { entity: short-answer-question, effect: reads, facts: [Prompt, Accepted answers] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Creator marks the answer correct
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
      - { entity: short-answer-question, effect: reads, facts: [Points] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: Whoever made the attempt sees the new score, and the quiz results include it
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [Score] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Mark a short answer correct

## Trigger

The Creator sees a short answer that is right but was worded differently from
every accepted answer.

## Outcome

The answer counts as correct, and the attempt's score includes its points.

## Edge cases

- The same wording appears in other attempts → each is graded on its own.
