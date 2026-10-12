---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator starts a new question in their quiz that takes a typed answer
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator writes the prompt, lists the typed answers that score, and adds an explanation and the points
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product checks that at least one answer is accepted
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product adds the short-answer question at the end of the quiz
    kind: product
    actor: creator
    entities:
      - { entity: short-answer-question, effect: creates, to: Included, facts: [Prompt, Accepted answers, Explanation, Points] }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Write a short-answer question

## Trigger

The Creator wants learners to recall an answer rather than recognize it.

## Outcome

The question is part of the quiz, last in its order, and a typed answer scores
when it matches one of the accepted answers.

## Edge cases

- Two accepted answers differ only in capital letters or surrounding spaces → they are kept as one.
