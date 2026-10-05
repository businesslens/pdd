---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator opens one submitted attempt from the results of their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: attempt, effect: reads, facts: [Score] }
      - { entity: account, effect: reads, facts: [Display name] }
    contexts:
      web:
        place: quiz-web::quiz-results
  - text: The Product shows each question with the answer given, whether it scored, and the correct answer
    kind: product
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [Answers, Score, Submitted at] }
      - { entity: question, effect: reads, facts: [Prompt, Correct answer, Points] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Review one attempt

## Trigger

The Creator wants to see how one learner answered.

## Outcome

The Creator sees that attempt answer by answer, and nothing about it has
changed.

## Edge cases

- The learner has practiced since → their practice rounds are not shown.
