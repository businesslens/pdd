---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator opens a question of their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator changes its prompt, options, correct answer, explanation or points
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product checks that the question still has a correct answer it can score
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product saves the question in its place in the quiz
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: changes, facts: [Prompt, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Edit a question

## Trigger

The Creator wants to fix or improve a question.

## Outcome

The question asks what the Creator now wants, in the same place in the quiz.

## Edge cases

- The change removes the only correct answer → the Product refuses it and keeps the Creator's edit to finish.
