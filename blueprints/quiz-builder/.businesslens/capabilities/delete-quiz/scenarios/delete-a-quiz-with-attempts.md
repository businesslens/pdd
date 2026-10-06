---
kind: edge
routes:
  web: Web
steps:
  - text: The Creator chooses to delete a closed quiz that has been taken
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product says how many attempts the quiz holds and that they, their results and their practice will be deleted for good
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: removes, from: Closed }
      - { entity: choice-question, effect: removes, from: Included }
      - { entity: short-answer-question, effect: removes, from: Included }
      - { entity: attempt, effect: removes, from: Submitted }
      - { entity: practice-round, effect: removes, from: Finished }
      - { entity: class, effect: changes, facts: [Assigned quizzes] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The share link no longer opens anything, and no class lists the deleted quiz
    kind: condition
    entities:
      - { entity: quiz, effect: reads, facts: [Share link] }
      - { entity: class, effect: reads, facts: [Assigned quizzes] }
    contexts:
      web:
        place: quiz-web::quizzes
---

# Delete a quiz with attempts

## Trigger

The Creator wants a quiz gone that learners have already taken.

## Outcome

The quiz, its questions, every attempt at it and every practice round drawn from
it are gone for good, and it has left every class it was assigned to.

## Edge cases

- The Creator only wants to stop new attempts → they close the quiz instead, and nothing is deleted.
