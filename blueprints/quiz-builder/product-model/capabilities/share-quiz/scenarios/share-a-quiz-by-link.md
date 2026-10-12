---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to share their draft quiz by link
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title, Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product checks that the quiz has at least one question
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product opens the quiz and gives it a share link
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: changes, from: Draft, to: Open, facts: [Share link] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product shows the share link for the Creator to pass on
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Share link] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Share a quiz by link

## Trigger

The Creator has finished a quiz and wants learners to take it.

## Outcome

The quiz is open, and any signed-in learner who follows its share link can make
their one attempt.
