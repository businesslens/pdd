---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner submits an attempt with some questions unanswered
    kind: actor
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [Answers] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product says how many questions are unanswered and asks the Learner to confirm
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: reads, facts: [] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Learner confirms
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: quiz-web::attempt
  - text: The Product scores the attempt, unanswered questions scoring nothing, and submits it
    kind: product
    actor: learner
    entities:
      - { entity: attempt, effect: changes, from: In progress, to: Submitted, facts: [Answers, Score, Submitted at] }
      - { entity: question, effect: reads, facts: [Points] }
    contexts:
      web:
        place: quiz-web::attempt
---

# Submit with questions unanswered

## Trigger

The Learner submits before answering every question.

## Outcome

The attempt is submitted with the answers given; unanswered questions score
nothing.

## Edge cases

- The Learner declines to confirm → the attempt stays in progress with every answer kept.
