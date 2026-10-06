---
kind: edge
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
  - text: The Product says how many attempts are in progress and that they will be submitted as they stand
    kind: product
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [] }
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
  - text: The Product submits each attempt in progress with the answers given so far, unanswered questions scoring nothing
    kind: product
    actor: creator
    entities:
      - { entity: attempt, effect: changes, from: In progress, to: Submitted, facts: [Answers, Score, Submitted at] }
      - { entity: choice-question, effect: reads, facts: [Correct answer, Points] }
      - { entity: short-answer-question, effect: reads, facts: [Accepted answers, Points] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: Those attempts count in the quiz's results with their scores
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [Score] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Close a quiz with attempts in progress

## Trigger

The Creator closes a quiz while some learners are part-way through it.

## Outcome

The quiz is closed, and every unfinished attempt is submitted and scored on what
was answered.
