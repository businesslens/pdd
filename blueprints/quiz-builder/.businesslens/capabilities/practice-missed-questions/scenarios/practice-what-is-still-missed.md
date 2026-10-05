---
kind: edge
routes:
  web: Web
steps:
  - text: The Learner finishes a practice round and chooses to practice again
    kind: actor
    actor: learner
    entities:
      - { entity: practice-round, as: earlier, effect: reads, facts: [Correct count] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Product finds the questions the earlier round still got wrong
    kind: product
    actor: learner
    entities:
      - { entity: practice-round, as: earlier, effect: reads, facts: [Answers] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Product orders them so those missed in the most rounds come first
    kind: product
    actor: learner
    entities:
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Product starts a new practice round of those questions
    kind: product
    actor: learner
    entities:
      - { entity: practice-round, as: next, effect: creates, to: In progress, facts: [Questions] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Learner answers each question in turn
    kind: actor
    actor: learner
    entities:
      - { entity: practice-round, as: next, effect: changes, facts: [Answers] }
      - { entity: question, effect: reads, facts: [Prompt, Answer options] }
    contexts:
      web:
        place: quiz-web::practice
  - text: The Product finishes the round with how many the Learner got right
    kind: product
    actor: learner
    entities:
      - { entity: practice-round, as: next, effect: changes, from: In progress, to: Finished, facts: [Correct count] }
    contexts:
      web:
        place: quiz-web::practice
---

# Practice what is still missed

## Trigger

The Learner still missed some questions in a practice round.

## Outcome

A new round repeats only what the Learner still got wrong, so each round is
shorter than the last while mistakes remain.

## Edge cases

- Every question was right in the earlier round → the Product says there is nothing left to practice and starts no round.
