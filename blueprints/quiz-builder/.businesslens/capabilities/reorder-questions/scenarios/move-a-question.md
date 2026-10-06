---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator moves a question to another position in their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: changes, facts: [Question order] }
      - { entity: choice-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product asks the questions in the new order from now on
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Move a question

## Trigger

The Creator wants a question asked earlier or later.

## Outcome

Learners who start an attempt afterwards are asked in the new order; submitted
attempts and their scores are unchanged.

## Edge cases

- A learner has an attempt in progress → their answers are kept, and the questions follow the new order.
