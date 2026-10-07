---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator enters a name
    kind: actor
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product creates the class, owned by the Creator, with a new join code and nobody in it yet
    kind: product
    actor: creator
    entities:
      - { entity: class, effect: creates, facts: [Name, Join code, Assigned quizzes] }
    contexts:
      web:
        place: quiz-web::classes
  - text: The Product opens the class and shows its join code to pass on
    kind: product
    actor: creator
    entities:
      - { entity: class, effect: reads, facts: [Name, Join code] }
    contexts:
      web:
        place: quiz-web::class
---

# Create a class

## Trigger

The Creator wants to share quizzes with the same group of learners again and
again.

## Outcome

A class with the chosen name and its own join code exists, owned by the Creator,
ready for learners to join.
