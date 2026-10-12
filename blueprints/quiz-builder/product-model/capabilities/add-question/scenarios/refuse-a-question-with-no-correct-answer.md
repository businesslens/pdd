---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator writes a prompt and options without marking any option as scoring
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product finds no answer it could score
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says what is missing and keeps what was written
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: Nothing is added to the quiz
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Refuse a question with no correct answer

## Trigger

The Creator tries to add a question that has no answer that scores.

## Outcome

Nothing is added, the quiz is unchanged, and the Creator's wording is kept for
them to finish.

## Edge cases

- A short-answer question with no accepted answers is refused the same way.
