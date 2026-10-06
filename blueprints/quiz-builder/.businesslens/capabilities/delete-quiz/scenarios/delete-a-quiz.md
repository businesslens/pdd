---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to delete their draft quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product asks the Creator to confirm that the quiz and its questions will be deleted for good
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title, Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: removes, from: Draft }
      - { entity: choice-question, effect: removes, from: Included, with: quiz }
      - { entity: short-answer-question, effect: removes, from: Proposed, with: quiz }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product returns the Creator to their quizzes, without the deleted one
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quizzes
---

# Delete a quiz

## Trigger

The Creator no longer wants a quiz they started.

## Outcome

The quiz, every question in it and every question proposed for it are gone for
good.

## Edge cases

- The Creator declines to confirm → the quiz is unchanged.
