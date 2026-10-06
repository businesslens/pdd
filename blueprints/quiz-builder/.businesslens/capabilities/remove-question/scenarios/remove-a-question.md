---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to remove a choice question from their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
      - { entity: choice-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product asks the Creator to confirm
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: choice-question, effect: removes, from: Included }
      - { entity: quiz, effect: changes, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: Submitted attempts keep the scores they were given
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [Score] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Remove a question

## Trigger

The Creator no longer wants a question asked.

## Outcome

The question is gone for good, and nothing already submitted changes.

## Edge cases

- A short-answer question → it is removed the same way.
- The Creator declines to confirm → the question stays where it was.
