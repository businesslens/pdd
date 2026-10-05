---
kind: edge
result: achieved
routes:
  web: Web
steps:
  - text: The Creator creates and titles a new quiz
    kind: actor
    actor: creator
    capability: create-quiz
    entities:
      - { entity: quiz, effect: creates, to: Draft, facts: [Title, Question order, Answer reveal] }
    contexts:
      web:
        place: quiz-web::quizzes
  - text: The Product opens the empty quiz in the editor
    kind: product
    actor: creator
    capability: create-quiz
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator writes the quiz's questions
    kind: actor
    actor: creator
    capability: add-question
    entities:
      - { entity: question, effect: creates, to: Included, facts: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator shares the quiz with one of their classes
    kind: actor
    actor: creator
    capability: share-quiz
    entities:
      - { entity: quiz, effect: changes, from: Draft, to: Open, facts: [Share link] }
      - { entity: class, effect: changes, facts: [Assigned quizzes] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Write and share a quiz with a class

## Trigger

The Creator decides to quiz one of their classes on a topic.

## Outcome

The Journey goal is achieved: the quiz is open and listed for everyone in the
class.
