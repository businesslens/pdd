---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to close their open quiz
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
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
      - { entity: quiz, effect: changes, from: Open, to: Closed, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The share link and the class listings no longer start an attempt
    kind: condition
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Share link] }
      - { entity: class, effect: reads, facts: [Assigned quizzes] }
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Close an open quiz

## Trigger

The Creator has collected the attempts they need.

## Outcome

The quiz is closed: no new attempt can start, and its results are unchanged.

## Edge cases

- The Creator declines to confirm → the quiz stays open.
