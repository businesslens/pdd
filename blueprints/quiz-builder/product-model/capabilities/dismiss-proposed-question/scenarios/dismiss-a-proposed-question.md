---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator dismisses a proposed short-answer question
    kind: actor
    actor: creator
    entities:
      - { entity: short-answer-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product discards the proposed question
    kind: product
    actor: creator
    entities:
      - { entity: short-answer-question, effect: removes, from: Proposed }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The quiz and the other proposed questions are unchanged
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Dismiss a proposed question

## Trigger

The Creator reviews a question the Product proposed and does not want it.

## Outcome

The proposed question is gone, and the quiz is exactly as it was.

## Edge cases

- A proposed choice question → it is dismissed the same way.
