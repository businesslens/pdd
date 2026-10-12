---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator gives their class a new name
    kind: actor
    actor: creator
    entities:
      - { entity: class, effect: changes, facts: [Name] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Product shows the new name to the Creator and to everyone who has joined
    kind: product
    actor: creator
    entities:
      - { entity: class, effect: reads, facts: [Name] }
      - { entity: enrollment, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::class
---

# Rename a class

## Trigger

The Creator wants the class called something else, such as a new term's name.

## Outcome

The class carries the new name; its join code, learners and assigned quizzes are
unchanged.

## Edge cases

- The Creator leaves the name empty → the Product asks for a name and the class keeps its former one.
