---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator discards a drafted question
    kind: actor
    actor: creator
    entities:
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product deletes the draft
    kind: product
    actor: creator
    entities:
      - { entity: question, effect: removes, from: Drafted }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The quiz and the other drafts are unchanged
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Discard a drafted question

## Trigger

The Creator reviews a question the Quiz assistant drafted and does not want it.

## Outcome

The draft is gone, and the quiz is exactly as it was.
