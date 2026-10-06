---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator changes their quiz's title and whether it reveals answers after submitting
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: changes, facts: [Title, Answer reveal] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product shows the new title wherever the quiz is listed
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title, Answer reveal] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Edit a quiz

## Trigger

The Creator wants the quiz called something else, or wants to keep its answers
from learners.

## Outcome

The quiz carries the new title and answer reveal; its questions and any attempts
are unchanged.

## Edge cases

- The quiz is open and the Creator stops revealing answers → learners who already submitted no longer see correct answers or explanations.
