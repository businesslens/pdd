---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to share their closed quiz again
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product opens the quiz at its former share link and for the classes it was assigned to
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: changes, from: Closed, to: Open, facts: [] }
      - { entity: class, effect: reads, facts: [Assigned quizzes] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: Anyone who has not submitted an attempt can take it, and submitted attempts stay as they were
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Reopen a closed quiz

## Trigger

The Creator closed a quiz and wants to let more learners take it.

## Outcome

The quiz is open again at the same link; nothing already submitted changes.
