---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator opens the results of their quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-results
  - text: No attempt has been submitted yet
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-results
  - text: The Product says there are no results yet and shows the quiz's share link
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Share link] }
    contexts:
      web:
        place: quiz-web::quiz-results
---

# Review a quiz with no attempts

## Trigger

The Creator checks results before anyone has submitted.

## Outcome

The Creator knows nobody has submitted yet and has the link to pass on.
