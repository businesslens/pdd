---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to delete their class
    kind: actor
    actor: creator
    entities:
      - { entity: class, effect: reads, facts: [Name] }
      - { entity: enrollment, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Product asks the Creator to confirm that the class and who has joined it will be deleted for good, and says its quizzes are kept
    kind: product
    actor: creator
    entities:
      - { entity: class, effect: reads, facts: [Name] }
      - { entity: quiz, effect: reads, facts: [Title] }
    contexts:
      web:
        place: quiz-web::class
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: class, effect: removes }
      - { entity: enrollment, effect: removes, with: class }
    contexts:
      web:
        place: quiz-web::class
  - text: The Product returns the Creator to their classes, without the deleted one
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: quiz-web::classes
  - text: The join code no longer finds anything, and attempts made at the quizzes it listed are unchanged
    kind: condition
    actor: creator
    entities:
      - { entity: attempt, effect: reads, facts: [] }
    contexts:
      web:
        place: quiz-web::classes
---

# Delete a class

## Trigger

The Creator no longer teaches a group.

## Outcome

The class is gone for good. Its quizzes stay the Creator's, open or closed as
they were, and every attempt at them and its score is unchanged.

## Edge cases

- The Creator declines to confirm → the class is unchanged.
- A learner reached a quiz only through the class → they keep their submitted attempt and its practice.
