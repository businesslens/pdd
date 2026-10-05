---
kind: primary
routes:
  web: Web
steps:
  - text: The Learner enters a join code
    kind: actor
    actor: learner
    entities: []
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product finds the class the code belongs to
    kind: product
    actor: learner
    entities:
      - { entity: class, effect: reads, facts: [Join code] }
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product adds the Learner to the class
    kind: product
    actor: learner
    entities:
      - { entity: class, effect: changes, facts: [Learners] }
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product opens the class with the quizzes assigned to it
    kind: product
    actor: learner
    entities:
      - { entity: class, effect: reads, facts: [Name, Assigned quizzes] }
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::class
---

# Join a class with its code

## Trigger

The Learner has been given a join code.

## Outcome

The Learner is in the class and sees the quizzes assigned to it.

## Edge cases

- The Learner is already in the class → the Product opens the class and changes nothing.
