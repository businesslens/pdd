---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator starts a new quiz from their quizzes
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quizzes
  - text: The Creator gives it a title
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quizzes
  - text: The Product creates the quiz as a draft owned by the Creator, revealing answers after submitting
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: creates, to: Draft, facts: [Title, Question order, Answer reveal] }
    contexts:
      web:
        place: quiz-web::quizzes
  - text: The Product opens the empty quiz in the editor
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title, Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Create a quiz

## Trigger

The Creator wants to check what learners know about a topic.

## Outcome

A draft quiz with the chosen title exists, owned by the Creator, open in the
editor and invisible to learners.

## Edge cases

- The Creator leaves the title empty → no quiz is created and the Product asks for a title.
