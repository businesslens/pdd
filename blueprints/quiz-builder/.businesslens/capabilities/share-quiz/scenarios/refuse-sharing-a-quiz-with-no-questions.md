---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator chooses to share their draft quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product finds no question in the quiz, only drafts or nothing
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says the quiz needs a question before it can be shared
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The quiz stays a draft, with no share link
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Refuse sharing a quiz with no questions

## Trigger

The Creator tries to share a quiz that asks no questions yet.

## Outcome

Nothing is shared and the Creator knows the quiz needs a question first. Drafted
questions do not count until added.
