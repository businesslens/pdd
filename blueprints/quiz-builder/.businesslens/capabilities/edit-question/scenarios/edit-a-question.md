---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator opens a choice question of their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: choice-question, effect: reads, facts: [Prompt] }
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
  - text: The Product checks that one option still scores
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product saves the choice question in its place in the quiz
    kind: product
    actor: creator
    entities:
      - { entity: choice-question, effect: changes, facts: [Prompt, Answer options, Correct answer, Explanation, Points] }
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

- A short-answer question → the Creator changes its prompt, accepted answers, explanation or points the same way.
- The question is still proposed → it stays proposed, beside the quiz, until the Creator accepts or dismisses it.
- The change leaves no answer that scores → the Product refuses it and keeps the Creator's edit to finish.
