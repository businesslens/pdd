---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator clears their quiz's title and saves
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says a quiz needs a title
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The quiz keeps its former title
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Refuse a quiz with no title

## Trigger

The Creator saves the quiz with its title left empty.

## Outcome

Nothing changes, and the Creator knows a title is needed.
