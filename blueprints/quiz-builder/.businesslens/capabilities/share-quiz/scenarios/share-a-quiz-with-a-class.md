---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to share their draft quiz with one of their classes
    kind: actor
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Title] }
      - { entity: class, effect: reads, facts: [Name] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product checks that the quiz has at least one question
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: reads, facts: [Question order] }
      - { entity: question, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The Product opens the quiz and assigns it to the class
    kind: product
    actor: creator
    entities:
      - { entity: quiz, effect: changes, from: Draft, to: Open, facts: [Share link] }
      - { entity: class, effect: changes, facts: [Assigned quizzes] }
    contexts:
      web:
        place: quiz-web::quiz-editor
  - text: The quiz is listed for everyone in the class
    kind: condition
    entities:
      - { entity: class, effect: reads, facts: [Learners] }
      - { entity: quiz, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::quiz-editor
---

# Share a quiz with a class

## Trigger

The Creator wants a class to take a finished quiz.

## Outcome

The quiz is open and listed for every member of the class, now and as others
join.

## Edge cases

- The quiz is already open → it keeps its share link and is also assigned to the class.
